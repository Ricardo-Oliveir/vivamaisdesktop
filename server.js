// API Backend para o aplicativo VivaMais usando Firebase Firestore
// Este é um exemplo completo de como criar a API que o app React Native irá consumir

// Dependências necessárias:
// npm install express firebase-admin cors helmet bcryptjs jsonwebtoken dotenv

const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializar Firebase Admin SDK
let db;
try {
  // Verificar se já foi inicializado
  if (!admin.apps.length) {
    // Para desenvolvimento local, você pode usar o arquivo de chave do serviço
    // Para produção, use variáveis de ambiente
    if (process.env.FIREBASE_PRIVATE_KEY) {
      // Produção - usar variáveis de ambiente
      admin.initializeApp({
        credential: admin.credential.cert({
          type: "service_account",
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: "https://accounts.google.com/o/oauth2/auth",
          token_uri: "https://oauth2.googleapis.com/token",
          auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
        }),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    } else {
      // Desenvolvimento - usar arquivo de chave do serviço
      // Coloque o arquivo firebase-adminsdk-key.json na raiz do projeto
      const serviceAccount = require('./firebase-adminsdk-key.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
    }
  }
  
  db = admin.firestore();
  console.log('✅ Conectado ao Firebase Firestore');
} catch (err) {
  console.error('❌ Erro ao conectar com o Firebase:', err);
  console.error('💡 Certifique-se de ter o arquivo firebase-adminsdk-key.json ou as variáveis de ambiente configuradas');
  process.exit(1);
}

// Middleware - CORS configurado para React Native
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sem origin (mobile apps, postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3001', //pagina web
      'http://localhost:8081',
      'http://localhost:19006', 
      'http://10.125.129.8:8081',
      'http://172.20.10.4:8081',  // SEU IP REAL
      'http://172.20.10.4:19006', // SEU IP REAL
      'exp://172.20.10.4:19000',  // SEU IP REAL
      'exp://localhost:19000',
      'http://10.0.3.28:8081',      // IP antigo (backup)
      'http://10.0.3.28:19006',     // IP antigo (backup)  
      'exp://10.0.3.28:19000'       // IP antigo (backup)
    ];
    
    console.log(`🌐 CORS check - Origin: ${origin}`);
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      console.log(`❌ CORS bloqueado para origin: ${origin}`);
      callback(null, true); // Permitindo por enquanto para debug
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

// Middleware de logging para debug
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - Origin: ${req.get('Origin')} - IP: ${req.ip}`);
  console.log(`📋 Headers:`, req.headers);
  next();
});

// Middleware para verificar JWT
const authenticateToken = (req, res, next) => {
  console.log('🔐 === MIDDLEWARE DE AUTENTICAÇÃO ===');
  
  const authHeader = req.headers['authorization'];
  console.log('🔐 Authorization header:', authHeader ? 'Presente' : 'Ausente');
  
  const token = authHeader && authHeader.split(' ')[1];
  console.log('🔐 Token extraído:', token ? `${token.substring(0, 20)}...` : 'Nenhum');

  if (!token) {
    console.log('❌ Nenhum token fornecido');
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'vivamais-secret-key', (err, user) => {
    if (err) {
      console.log('❌ Erro na verificação do JWT:', err.message);
      console.log('🔐 Token completo:', token);
      console.log('🔐 JWT_SECRET usado:', process.env.JWT_SECRET || 'vivamais-secret-key');
      return res.status(403).json({ error: 'Token inválido', details: err.message });
    }
    
    console.log('✅ Token válido! Usuário:', user.username, 'ID:', user.id);
    req.user = user;
    next();
  });
};

// ROTAS

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'Firebase Firestore connected'
  });
});

// Initialize Database - Endpoint para criar estruturas no Firestore
app.post('/api/init-database', async (req, res) => {
  try {
    console.log('🔧 Inicializando estruturas do banco de dados...');
    
    // Verificar se já existe dados
    const collections = ['users', 'questionnaires', 'questions', 'responses'];
    const status = {};
    
    for (const collectionName of collections) {
      try {
        const snapshot = await db.collection(collectionName).limit(1).get();
        status[collectionName] = {
          exists: !snapshot.empty,
          count: snapshot.size
        };
      } catch (error) {
        status[collectionName] = { 
          exists: false, 
          error: error.message 
        };
      }
    }
    
    // Criar usuário admin se não existir
    const adminSnapshot = await db.collection('users')
      .where('username', '==', 'admin')
      .limit(1)
      .get();
    
    if (adminSnapshot.empty) {
      console.log('👑 Criando usuário admin...');
      const adminPassword = 'admin123';
      const password_hash = await bcrypt.hash(adminPassword, 12);
      
      await db.collection('users').add({
        username: 'admin',
        full_name: 'Administrador',
        email: 'admin@vivamais.com',
        password_hash,
        role: 'admin',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
        is_active: true
      });
      
      status.adminUser = 'created';
      console.log('✅ Usuário admin criado!');
    } else {
      status.adminUser = 'exists';
      console.log('✅ Usuário admin já existe');
    }
    
    // Criar questionários de exemplo se não existirem
    const questionnaireSnapshot = await db.collection('questionnaires').limit(1).get();
    
    if (questionnaireSnapshot.empty) {
      console.log('📝 Criando questionários de exemplo...');
      
      // Questionário 1
      const questionnaire1Ref = await db.collection('questionnaires').add({
        title: 'Pesquisa de Satisfação - Serviços para Idosos',
        description: 'Avalie a qualidade dos serviços oferecidos para a terceira idade em nossa comunidade',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
        is_active: true
      });
      
      // Perguntas para o questionário 1
      const questions1 = [
        {
          text: 'Como você avalia o atendimento que recebeu?',
          type: 'rating',
          options: null,
          order: 1,
          is_required: true
        },
        {
          text: 'Você recomendaria nossos serviços para outros idosos?',
          type: 'yes_no',
          options: null,
          order: 2,
          is_required: true
        },
        {
          text: 'Qual aspecto do atendimento você considera mais importante?',
          type: 'multiple_choice',
          options: ['Rapidez no atendimento', 'Gentileza dos funcionários', 'Clareza nas informações', 'Ambiente acolhedor', 'Facilidade de acesso'],
          order: 3,
          is_required: true
        }
      ];
      
      for (const question of questions1) {
        await db.collection('questions').add({
          ...question,
          questionnaire_id: questionnaire1Ref.id,
          created_at: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      // Questionário 2
      const questionnaire2Ref = await db.collection('questionnaires').add({
        title: 'Avaliação de Acessibilidade',
        description: 'Como podemos melhorar a acessibilidade dos nossos serviços?',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
        is_active: true
      });
      
      // Perguntas para o questionário 2
      const questions2 = [
        {
          text: 'Como você avalia a facilidade de acesso ao nosso local?',
          type: 'rating',
          options: null,
          order: 1,
          is_required: true
        },
        {
          text: 'Que melhorias de acessibilidade você sugere?',
          type: 'text',
          options: null,
          order: 2,
          is_required: false
        }
      ];
      
      for (const question of questions2) {
        await db.collection('questions').add({
          ...question,
          questionnaire_id: questionnaire2Ref.id,
          created_at: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      status.questionnaires = 'created';
      console.log('✅ Questionários de exemplo criados!');
    } else {
      status.questionnaires = 'exists';
      console.log('✅ Questionários já existem');
    }
    
    res.json({
      success: true,
      message: 'Banco de dados inicializado com sucesso',
      collections: status,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug endpoint - Listar todas as questões
app.get('/api/debug/questions', async (req, res) => {
  try {
    console.log('🔍 DEBUG: Listando TODAS as questões no banco');
    
    const snapshot = await db.collection('questions').get();
    const allQuestions = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      allQuestions.push({
        id: doc.id,
        questionnaire_id: data.questionnaire_id,
        text: data.text,
        type: data.type,
        order: data.order || data.order_index
      });
    });
    
    console.log(`🔍 DEBUG: Total de questões no banco: ${allQuestions.length}`);
    
    res.json({
      total: allQuestions.length,
      questions: allQuestions
    });
    
  } catch (error) {
    console.error('❌ Erro no debug de questões:', error);
    res.status(500).json({ error: error.message });
  }
});

// Migração para estrutura embedded - ENDPOINT TEMPORÁRIO
app.post('/api/migrate-to-embedded', async (req, res) => {
  try {
    console.log('🔄 INICIANDO MIGRAÇÃO para estrutura embedded...');
    
    // 1. Buscar todos os questionários
    const questionnairesSnapshot = await db.collection('questionnaires').get();
    let migratedCount = 0;
    
    for (const questionnaireDoc of questionnairesSnapshot.docs) {
      const questionnaireData = questionnaireDoc.data();
      const questionnaireId = questionnaireDoc.id;
      
      console.log(`📝 Migrando questionário: ${questionnaireData.title}`);
      
      // 2. Buscar questões da coleção separada
      const questionsSnapshot = await db.collection('questions')
        .where('questionnaire_id', '==', questionnaireId)
        .get();
      
      const embeddedQuestions = [];
      questionsSnapshot.forEach(questionDoc => {
        const questionData = questionDoc.data();
        embeddedQuestions.push({
          id: questionDoc.id,
          text: questionData.text,
          type: questionData.type,
          options: questionData.options ? JSON.parse(questionData.options) : null,
          order: questionData.order || questionData.order_index || 0,
          is_required: questionData.is_required !== false
        });
      });
      
      // Ordenar questões por order
      embeddedQuestions.sort((a, b) => a.order - b.order);
      
      // 3. Atualizar questionário com questões embedded
      await db.collection('questionnaires').doc(questionnaireId).update({
        questions: embeddedQuestions,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ Questionário ${questionnaireData.title} migrado com ${embeddedQuestions.length} questões`);
      migratedCount++;
    }
    
    console.log(`🎉 MIGRAÇÃO CONCLUÍDA: ${migratedCount} questionários migrados`);
    
    res.json({
      success: true,
      message: `Migração concluída com sucesso`,
      questionnaires_migrated: migratedCount
    });
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Network Test - Para debug React Native
app.get('/api/network-test', (req, res) => {
  res.json({
    message: '✅ Conexão entre React Native e servidor funcionando!',
    timestamp: new Date().toISOString(),
    clientIP: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    origin: req.get('Origin'),
    headers: {
      'content-type': req.get('Content-Type'),
      'authorization': req.get('Authorization') ? 'Present' : 'Not present'
    }
  });
});

// Teste do banco - Para verificar se o Firestore está funcionando
app.get('/api/database-test', async (req, res) => {
  try {
    console.log('🧪 Testando Firestore...');
    
    const tests = {};

    // Teste 1: Verificar coleções
    const collections = ['users', 'questionnaires', 'questions', 'responses'];
    tests.collections = {};
    
    for (const collectionName of collections) {
      try {
        const snapshot = await db.collection(collectionName).limit(1).get();
        tests.collections[collectionName] = {
          exists: true,
          documentCount: snapshot.size
        };
      } catch (err) {
        tests.collections[collectionName] = {
          exists: false,
          error: err.message
        };
      }
    }

    // Teste 2: Verificar usuário admin
    try {
      const adminSnapshot = await db.collection('users')
        .where('username', '==', 'admin')
        .limit(1)
        .get();
      
      if (!adminSnapshot.empty) {
        const adminDoc = adminSnapshot.docs[0];
        tests.adminUser = {
          id: adminDoc.id,
          ...adminDoc.data(),
          password_hash: '[HIDDEN]' // Não expor o hash da senha
        };
      } else {
        tests.adminUser = null;
      }
    } catch (err) {
      tests.adminUser = { error: err.message };
    }

    // Teste 3: Contar documentos em cada coleção
    tests.counts = {};
    for (const collectionName of collections) {
      try {
        const snapshot = await db.collection(collectionName).get();
        tests.counts[collectionName] = snapshot.size;
      } catch (err) {
        tests.counts[collectionName] = `Error: ${err.message}`;
      }
    }

    res.json({
      success: true,
      message: 'Testes do Firebase Firestore executados com sucesso',
      tests,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro nos testes do banco:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao executar testes do banco',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// === ROTAS DE AUTENTICAÇÃO ===

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username e password são obrigatórios' });
    }

    console.log(`🔑 Tentativa de login para: ${username}`);

    // Buscar usuário no Firestore
    const userSnapshot = await db.collection('users')
      .where('username', '==', username)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      console.log(`❌ Usuário não encontrado: ${username}`);
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, userData.password_hash);
    
    if (!isValidPassword) {
      console.log(`❌ Senha inválida para usuário: ${username}`);
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar se usuário está ativo
    if (!userData.is_active) {
      console.log(`❌ Usuário inativo: ${username}`);
      return res.status(401).json({ error: 'Usuário inativo' });
    }

    // Gerar JWT
    const token = jwt.sign(
      { 
        id: userDoc.id,
        username: userData.username,
        role: userData.role 
      },
      process.env.JWT_SECRET || 'vivamais-secret-key',
      { expiresIn: '24h' }
    );

    console.log(`✅ Login bem-sucedido para: ${username}`);

    res.json({
      success: true,
      user: {
        id: userDoc.id,
        username: userData.username,
        full_name: userData.full_name,
        email: userData.email,
        role: userData.role
      },
      token
    });

  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Registro de usuário
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, full_name, email, password, role = 'user' } = req.body;

    // Validações
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email e password são obrigatórios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password deve ter pelo menos 6 caracteres' });
    }

    console.log(`📝 Tentativa de registro para: ${username}`);

    // Verificar se username já existe
    const usernameSnapshot = await db.collection('users')
      .where('username', '==', username)
      .limit(1)
      .get();

    if (!usernameSnapshot.empty) {
      return res.status(400).json({ error: 'Username já existe' });
    }

    // Verificar se email já existe
    const emailSnapshot = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!emailSnapshot.empty) {
      return res.status(400).json({ error: 'Email já existe' });
    }

    // Hash da senha
    const password_hash = await bcrypt.hash(password, 12);

    // Criar usuário no Firestore
    const newUser = {
      username,
      full_name: full_name || username,
      email,
      password_hash,
      role,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      is_active: true
    };

    const userRef = await db.collection('users').add(newUser);

    console.log(`✅ Usuário criado com sucesso: ${username} (ID: ${userRef.id})`);

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      user: {
        id: userRef.id,
        username,
        full_name: full_name || username,
        email,
        role
      }
    });

  } catch (error) {
    console.error('❌ Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 1. Listar todos os usuários (Para a tela de Usuários)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    console.log('👥 Listando usuários...');
    
    // Busca todos na coleção 'users'
    const snapshot = await db.collection('users').get();
    const users = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      users.push({
        id: doc.id,
        username: data.username,
        full_name: data.full_name,
        email: data.email,
        role: data.role,
        is_active: data.is_active
      });
    });

    console.log(`✅ ${users.length} usuários encontrados`);
    res.json(users);

  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 2. Deletar usuário
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Segurança: Admin não pode excluir a si mesmo
    if (req.user && id === req.user.id) {
        return res.status(400).json({ error: 'Você não pode excluir a si mesmo.' });
    }

    console.log(`🗑️ Removendo usuário ID: ${id}`);
    await db.collection('users').doc(id).delete();
    
    res.json({ message: 'Usuário removido com sucesso' });

  } catch (error) {
    console.error('❌ Erro ao deletar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// === ROTAS DE QUESTIONÁRIOS ===

// Listar todos os questionários
app.get('/api/questionnaires', authenticateToken, async (req, res) => {
  try {
    console.log('📋 Buscando questionários...');
    
    // Consulta simples sem índice - buscar todos e filtrar no código
    const snapshot = await db.collection('questionnaires').get();

    const questionnaires = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Filtrar apenas questionários ativos
      if (data.is_active !== false) { // Incluir se is_active for true ou undefined
        questionnaires.push({
          id: doc.id,
          ...data,
          created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
          updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at
        });
      }
    });

    // Ordenar por data de criação (mais recente primeiro)
    questionnaires.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
    });

    console.log(`✅ ${questionnaires.length} questionários encontrados`);
    res.json(questionnaires);

  } catch (error) {
    console.error('❌ Erro ao buscar questionários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar questionários ativos (para usuários comuns)
app.get('/api/questionnaires/active', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.query;
    const currentUserId = userId || req.user.id;
    
    console.log(`📋 Buscando questionários ativos para usuário: ${currentUserId}`);
    
    // Consulta simples para questionários ativos com questões
    const questionnaireSnapshot = await db.collection('questionnaires').get();
    
    // Buscar respostas do usuário para filtrar questionários já respondidos
    let userResponsedQuestionnaireIds = [];
    if (currentUserId) {
      console.log('🔍 Verificando questionários já respondidos...');
      
      // Converter userId para string para garantir compatibilidade
      const userIdString = String(currentUserId);
      console.log('🔍 Buscando sessões para userId (como string):', userIdString);
      
      const responsesSnapshot = await db.collection('response_sessions')
        .where('user_id', '==', userIdString)
        .get();
      
      console.log(`📊 Encontradas ${responsesSnapshot.docs.length} sessões de resposta`);
      
      userResponsedQuestionnaireIds = responsesSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📄 Sessão encontrada:', {
          sessionId: doc.id,
          questionnaire_id: data.questionnaire_id,
          user_id: data.user_id,
          respondent_name: data.respondent_name
        });
        return data.questionnaire_id;
      });
      console.log(`📝 Usuário já respondeu ${userResponsedQuestionnaireIds.length} questionários:`, userResponsedQuestionnaireIds);
    }

    const activeQuestionnaires = [];
    questionnaireSnapshot.forEach(doc => {
      const data = doc.data();
      
      // Filtrar apenas questionários ativos que têm questões E que o usuário NÃO respondeu
      if (data.is_active !== false && 
          data.questions && 
          data.questions.length > 0 && 
          !userResponsedQuestionnaireIds.includes(doc.id)) {
        activeQuestionnaires.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
          question_count: data.questions.length
        });
      }
    });

    // Ordenar por data de criação (mais recente primeiro)
    activeQuestionnaires.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
    });

    console.log(`✅ ${activeQuestionnaires.length} questionários ativos encontrados`);
    res.json(activeQuestionnaires);

  } catch (error) {
    console.error('❌ Erro ao buscar questionários ativos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar questionário por ID
app.get('/api/questionnaires/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const doc = await db.collection('questionnaires').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Questionário não encontrado' });
    }

    const data = doc.data();
    const questionnaire = {
      id: doc.id,
      ...data,
      created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
      updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at
    };

    res.json(questionnaire);

  } catch (error) {
    console.error('❌ Erro ao buscar questionário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar novo questionário (com questões embedded)
app.post('/api/questionnaires', authenticateToken, async (req, res) => {
  try {
    const { title, description, questions = [] } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Título é obrigatório' });
    }

    console.log(`📝 Criando questionário: ${title} com ${questions.length} questões`);

    // Processar questões para estrutura embedded
    const processedQuestions = questions.map((question, index) => ({
      id: question.id || `q${index + 1}`,
      text: question.text,
      type: question.type,
      options: question.options || null,
      order: question.order || index + 1,
      is_required: question.is_required !== false // default true
    }));

    const newQuestionnaire = {
      title,
      description: description || '',
      created_by: req.user.id,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      is_active: true,
      questions: processedQuestions  // 🔥 QUESTÕES EMBEDDED
    };

    const docRef = await db.collection('questionnaires').add(newQuestionnaire);

    console.log(`✅ Questionário criado: ${docRef.id} com ${processedQuestions.length} questões embedded`);
    
    res.status(201).json({
      success: true,
      id: docRef.id,
      message: 'Questionário criado com sucesso',
      questions_count: processedQuestions.length
    });

  } catch (error) {
    console.error('❌ Erro ao criar questionário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar questionário
app.put('/api/questionnaires/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Título é obrigatório' });
    }

    console.log(`✏️ Atualizando questionário: ${id}`);

    const updates = {
      title,
      description: description || '',
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('questionnaires').doc(id).update(updates);

    console.log(`✅ Questionário atualizado: ${id}`);
    
    res.json({
      success: true,
      message: 'Questionário atualizado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar questionário:', error);
    if (error.code === 'not-found') {
      res.status(404).json({ error: 'Questionário não encontrado' });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

// Deletar questionário (soft delete)
app.delete('/api/questionnaires/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Deletando questionário: ${id}`);

    await db.collection('questionnaires').doc(id).update({
      is_active: false,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Questionário deletado: ${id}`);
    
    res.json({
      success: true,
      message: 'Questionário deletado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao deletar questionário:', error);
    if (error.code === 'not-found') {
      res.status(404).json({ error: 'Questionário não encontrado' });
    } else {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
});

// === ROTAS DE QUESTÕES ===

// Buscar questões de um questionário (estrutura embedded - MUITO MAIS SIMPLES!)
app.get('/api/questionnaires/:id/questions', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`❓ Buscando questões do questionário: ${id}`);
    
    // UMA SÓ CONSULTA! 🔥
    const doc = await db.collection('questionnaires').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Questionário não encontrado' });
    }

    const data = doc.data();
    const questions = data.questions || [];
    
    // Ordenar por order
    questions.sort((a, b) => (a.order || 0) - (b.order || 0));

    console.log(`✅ ${questions.length} questões encontradas (embedded)`);
    res.json(questions);

  } catch (error) {
    console.error('❌ Erro ao buscar questões:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Adicionar questão a um questionário (estrutura embedded)
app.post('/api/questionnaires/:id/questions', authenticateToken, async (req, res) => {
  try {
    const { id: questionnaireId } = req.params;
    const { text, type, options = null, order, is_required = true } = req.body;
    
    if (!text || !type) {
      return res.status(400).json({ error: 'text e type são obrigatórios' });
    }

    console.log(`❓ Adicionando questão ao questionário: ${questionnaireId}`);

    // Buscar o questionário
    const questionnaireRef = db.collection('questionnaires').doc(questionnaireId);
    const questionnaireDoc = await questionnaireRef.get();
    
    if (!questionnaireDoc.exists) {
      return res.status(404).json({ error: 'Questionário não encontrado' });
    }

    const questionnaireData = questionnaireDoc.data();
    const currentQuestions = questionnaireData.questions || [];
    
    // Gerar ID único para a questão
    const questionId = `q${currentQuestions.length + 1}`;
    
    const newQuestion = {
      id: questionId,
      text,
      type,
      options: options || null,
      order: order || currentQuestions.length + 1,
      is_required
    };

    // Adicionar a nova questão ao array
    const updatedQuestions = [...currentQuestions, newQuestion];
    
    // Atualizar o documento
    await questionnaireRef.update({
      questions: updatedQuestions,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Questão adicionada: ${questionId}`);
    
    res.status(201).json({
      success: true,
      id: questionId,
      message: 'Questão adicionada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao adicionar questão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar questão específica em questionário (estrutura embedded)
app.put('/api/questionnaires/:questionnaireId/questions/:questionId', authenticateToken, async (req, res) => {
  try {
    const { questionnaireId, questionId } = req.params;
    const { text, type, options, order, is_required } = req.body;
    
    console.log(`✏️ Atualizando questão ${questionId} do questionário ${questionnaireId}`);

    // Buscar o questionário
    const questionnaireRef = db.collection('questionnaires').doc(questionnaireId);
    const questionnaireDoc = await questionnaireRef.get();
    
    if (!questionnaireDoc.exists) {
      return res.status(404).json({ error: 'Questionário não encontrado' });
    }

    const questionnaireData = questionnaireDoc.data();
    const questions = questionnaireData.questions || [];
    
    // Encontrar e atualizar a questão
    const questionIndex = questions.findIndex(q => q.id === questionId);
    
    if (questionIndex === -1) {
      return res.status(404).json({ error: 'Questão não encontrada' });
    }

    // Atualizar apenas os campos fornecidos
    if (text !== undefined) questions[questionIndex].text = text;
    if (type !== undefined) questions[questionIndex].type = type;
    if (options !== undefined) questions[questionIndex].options = options;
    if (order !== undefined) questions[questionIndex].order = order;
    if (is_required !== undefined) questions[questionIndex].is_required = is_required;

    // Atualizar o documento
    await questionnaireRef.update({
      questions: questions,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Questão atualizada: ${questionId}`);
    
    res.json({
      success: true,
      message: 'Questão atualizada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar questão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar questão específica de questionário (estrutura embedded)
app.delete('/api/questionnaires/:questionnaireId/questions/:questionId', authenticateToken, async (req, res) => {
  try {
    const { questionnaireId, questionId } = req.params;
    
    console.log(`🗑️ Deletando questão ${questionId} do questionário ${questionnaireId}`);

    // Buscar o questionário
    const questionnaireRef = db.collection('questionnaires').doc(questionnaireId);
    const questionnaireDoc = await questionnaireRef.get();
    
    if (!questionnaireDoc.exists) {
      return res.status(404).json({ error: 'Questionário não encontrado' });
    }

    const questionnaireData = questionnaireDoc.data();
    const questions = questionnaireData.questions || [];
    
    // Filtrar para remover a questão
    const updatedQuestions = questions.filter(q => q.id !== questionId);
    
    if (updatedQuestions.length === questions.length) {
      return res.status(404).json({ error: 'Questão não encontrada' });
    }

    // Atualizar o documento
    await questionnaireRef.update({
      questions: updatedQuestions,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Questão deletada: ${questionId}`);
    
    res.json({
      success: true,
      message: 'Questão deletada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao deletar questão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// === ROTAS DE RESPOSTAS ===

// Criar sessão de resposta (para questionário completo)
app.post('/api/responses/session', authenticateToken, async (req, res) => {
  try {
    const { questionnaire_id, respondent_name, respondent_age = null, user_id = null } = req.body;
    
    if (!questionnaire_id || !respondent_name) {
      return res.status(400).json({ error: 'questionnaire_id e respondent_name são obrigatórios' });
    }

    console.log(`📝 Criando sessão de resposta para questionário: ${questionnaire_id}`);
    console.log(`👤 User ID recebido: ${user_id}`);
    console.log(`👤 User ID do token: ${req.user.id}`);

    const finalUserId = String(user_id || req.user.id); // Garantir que seja string
    console.log(`👤 User ID final que será salvo (como string): ${finalUserId}`);

    const newSession = {
      questionnaire_id,
      respondent_name,
      respondent_age: respondent_age || null,
      user_id: finalUserId,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      completed_at: null
    };

    console.log(`💾 Dados da sessão a ser criada:`, newSession);

    const docRef = await db.collection('response_sessions').add(newSession);

    console.log(`✅ Sessão de resposta criada: ${docRef.id}`);
    
    res.status(201).json({
      success: true,
      session_id: docRef.id,
      message: 'Sessão de resposta criada com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao criar sessão de resposta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Salvar resposta
app.post('/api/responses', authenticateToken, async (req, res) => {
  try {
    const { question_id, value, session_id = null, numeric_value = null } = req.body;
    
    if (!question_id || value === undefined) {
      return res.status(400).json({ error: 'question_id e value são obrigatórios' });
    }

    console.log(`💬 Salvando resposta para questão: ${question_id}`);

    const newResponse = {
      question_id,
      user_id: req.user.id,
      value: typeof value === 'string' ? value : JSON.stringify(value),
      numeric_value: numeric_value,
      session_id: session_id,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('responses').add(newResponse);

    console.log(`✅ Resposta salva: ${docRef.id}`);
    
    res.status(201).json({
      success: true,
      id: docRef.id,
      message: 'Resposta salva com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao salvar resposta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Verificar se usuário já respondeu um questionário específico
app.get('/api/users/:userId/questionnaires/:questionnaireId/answered', authenticateToken, async (req, res) => {
  try {
    const { userId, questionnaireId } = req.params;
    
    console.log(`🎯 ENDPOINT CORRETO CHAMADO! Usuário ${userId} x Questionário ${questionnaireId}`);
    console.log(`🔐 Usuário do token: ${req.user.id} (${req.user.username})`);
    console.log(`🔐 Usuário da URL: ${userId}`);
    
    // Verificar se o usuário pode acessar essas informações
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      console.log(`❌ ACESSO NEGADO! User do token (${req.user.id}) != User da URL (${userId})`);
      return res.status(403).json({ error: 'Acesso negado - você só pode verificar suas próprias respostas' });
    }
    
    console.log(`✅ ACESSO AUTORIZADO! Verificando respostas...`);
    
    // Buscar se existe uma sessão de resposta para este usuário e questionário
    const snapshot = await db.collection('response_sessions')
      .where('user_id', '==', String(userId))
      .where('questionnaire_id', '==', questionnaireId)
      .limit(1)
      .get();
    
    const answered = !snapshot.empty;
    
    if (answered) {
      const sessionData = snapshot.docs[0].data();
      console.log(`✅ ENCONTROU SESSÃO! Usuário JÁ RESPONDEU`, {
        sessionId: snapshot.docs[0].id,
        respondent_name: sessionData.respondent_name,
        created_at: sessionData.created_at?.toDate?.()?.toISOString()
      });
    } else {
      console.log(`❌ NENHUMA SESSÃO ENCONTRADA - Usuário NÃO RESPONDEU ainda`);
    }
    
    res.json({ answered });
    
  } catch (error) {
    console.error('❌ Erro ao verificar resposta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar respostas de um questionário
app.get('/api/questionnaires/:id/responses', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`💬 Buscando respostas do questionário: ${id}`);
    
    // Primeiro, buscar todas as questões do questionário
    const questionsSnapshot = await db.collection('questions')
      .where('questionnaire_id', '==', id)
      .get();

    const questionIds = [];
    questionsSnapshot.forEach(doc => {
      questionIds.push(doc.id);
    });

    if (questionIds.length === 0) {
      return res.json([]);
    }

    // Buscar respostas para essas questões
    const responses = [];
    
    // Firestore tem limite de 10 itens em consultas 'in', então fazemos em lotes
    const batchSize = 10;
    for (let i = 0; i < questionIds.length; i += batchSize) {
      const batch = questionIds.slice(i, i + batchSize);
      
      const snapshot = await db.collection('responses')
        .where('question_id', 'in', batch)
        .get();

      snapshot.forEach(doc => {
        const data = doc.data();
        responses.push({
          id: doc.id,
          ...data,
          created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at
        });
      });
    }

    // Ordenar respostas por data de criação (mais recente primeiro)
    responses.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
    });

    console.log(`✅ ${responses.length} respostas encontradas`);
    res.json(responses);

  } catch (error) {
    console.error('❌ Erro ao buscar respostas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar respostas de um usuário
app.get('/api/users/:userId/responses', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verificar se o usuário pode acessar essas respostas
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    console.log(`💬 Buscando respostas do usuário: ${userId}`);
    
    const snapshot = await db.collection('responses')
      .where('user_id', '==', userId)
      .get();

    const responses = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      responses.push({
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at
      });
    });

    // Ordenar respostas por data de criação (mais recente primeiro)
    responses.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
    });

    console.log(`✅ ${responses.length} respostas encontradas`);
    res.json(responses);

  } catch (error) {
    console.error('❌ Erro ao buscar respostas do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// === ROTAS DE ESTATÍSTICAS ===

// Estatísticas específicas de um questionário
app.get('/api/questionnaires/:id/statistics', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📊 Gerando estatísticas para questionário: ${id}`);

    // Buscar o questionário
    const questionnaireDoc = await db.collection('questionnaires').doc(id).get();
    
    if (!questionnaireDoc.exists) {
      return res.status(404).json({ error: 'Questionário não encontrado' });
    }

    const questionnaireData = questionnaireDoc.data();
    const questions = questionnaireData.questions || [];
    
    // Contar respostas para este questionário
    // Como as questões agora são embedded, precisamos buscar respostas por question_id
    let totalResponses = 0;
    const questionStats = [];
    
    for (const question of questions) {
      const responsesSnapshot = await db.collection('responses')
        .where('question_id', '==', question.id)
        .get();
      
      const questionResponseCount = responsesSnapshot.size;
      totalResponses += questionResponseCount;
      
      questionStats.push({
        questionId: question.id,
        questionText: question.text,
        type: question.type,
        responses: questionResponseCount
      });
    }

    const statistics = {
      questionnaireId: id,
      title: questionnaireData.title,
      totalQuestions: questions.length,
      totalResponses,
      averageResponsesPerQuestion: questions.length > 0 ? Math.round(totalResponses / questions.length) : 0,
      completionRate: questions.length > 0 ? Math.round((totalResponses / questions.length) * 100) : 0,
      questionStats
    };

    console.log(`✅ Estatísticas geradas para questionário ${id}`);
    res.json(statistics);

  } catch (error) {
    console.error('❌ Erro ao gerar estatísticas do questionário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/statistics', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Calculando estatísticas...');
    
    // Conta documentos nas coleções
    const usersSnap = await db.collection('users').get();
    const questsSnap = await db.collection('questionnaires').get();
    
    // Para respostas, precisamos contar todas (pode ser pesado se tiver milhares, mas serve por agora)
    // Se você tiver uma coleção 'responses' separada:
    const respSnap = await db.collection('responses').get();
    // OU se as respostas ficam dentro de sessões, conte as sessões:
    // const respSnap = await db.collection('response_sessions').get(); 

    // Filtra questionários ativos
    let activeQuests = 0;
    questsSnap.forEach(doc => {
        if (doc.data().is_active !== false) activeQuests++;
    });

    const stats = {
      totalUsers: usersSnap.size,
      totalQuestionnaires: activeQuests,
      totalResponses: respSnap.size // Ou 0 se não tiver respostas ainda
    };

    console.log('✅ Estatísticas:', stats);
    res.json(stats);

  } catch (error) {
    console.error('❌ Erro stats:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// Estatísticas específicas de uma questão
app.get('/api/questions/:questionId/statistics', authenticateToken, async (req, res) => {
  try {
    const { questionId } = req.params;
    
    console.log(`📊 Gerando estatísticas para questão: ${questionId}`);

    // Buscar todas as respostas para esta questão específica
    const responsesSnapshot = await db.collection('responses')
      .where('question_id', '==', questionId)
      .get();

    console.log(`🔍 Encontradas ${responsesSnapshot.size} respostas na collection 'responses'`);

    const responses = [];
    responsesSnapshot.forEach(doc => {
      const responseData = doc.data();
      console.log(`📝 Resposta encontrada:`, {
        id: doc.id,
        question_id: responseData.question_id,
        value: responseData.value,
        numeric_value: responseData.numeric_value,
        user_id: responseData.user_id
      });
      responses.push({
        id: doc.id,
        ...responseData,
        created_at: responseData.created_at?.toDate?.()?.toISOString() || responseData.created_at
      });
    });

    // Agrupar respostas por valor
    const responseStats = {};
    responses.forEach(response => {
      const value = response.value || response.numeric_value || 'N/A';
      console.log(`📊 Processando resposta com valor: "${value}"`);
      responseStats[value] = (responseStats[value] || 0) + 1;
    });

    console.log(`📊 Estatísticas agrupadas:`, responseStats);

    // Converter para array ordenado
    const statistics = Object.entries(responseStats).map(([value, count]) => ({
      response: value,
      count: count,
      percentage: responses.length > 0 ? Math.round((count / responses.length) * 100) : 0
    })).sort((a, b) => b.count - a.count);

    const result = {
      questionId,
      totalResponses: responses.length,
      statistics
    };

    console.log(`✅ Estatísticas finais geradas para questão ${questionId}:`, result);
    res.json(result);

  } catch (error) {
    console.error('❌ Erro ao gerar estatísticas da questão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Debug: Listar todas as respostas (apenas para desenvolvimento)
app.get('/api/debug/responses', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 DEBUG: Listando todas as respostas no banco...');
    
    const responsesSnapshot = await db.collection('responses').get();
    console.log(`🔍 Total de documentos na collection 'responses': ${responsesSnapshot.size}`);
    
    const responses = [];
    responsesSnapshot.forEach(doc => {
      const data = doc.data();
      responses.push({
        id: doc.id,
        question_id: data.question_id,
        user_id: data.user_id,
        value: data.value,
        numeric_value: data.numeric_value,
        session_id: data.session_id,
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at
      });
    });
    
    console.log('🔍 Respostas encontradas:', responses.length);
    responses.forEach((resp, index) => {
      console.log(`🔍 Resposta ${index + 1}:`, resp);
    });
    
    res.json({
      total: responses.length,
      responses: responses
    });
    
  } catch (error) {
    console.error('❌ Erro no debug das respostas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Debug: Listar todas as sessões (apenas para desenvolvimento)
app.get('/api/debug/sessions', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 DEBUG: Listando todas as sessões no banco...');
    
    const sessionsSnapshot = await db.collection('response_sessions').get();
    console.log(`🔍 Total de documentos na collection 'response_sessions': ${sessionsSnapshot.size}`);
    
    const sessions = [];
    sessionsSnapshot.forEach(doc => {
      const data = doc.data();
      sessions.push({
        id: doc.id,
        questionnaire_id: data.questionnaire_id,
        user_id: data.user_id,
        respondent_name: data.respondent_name,
        respondent_age: data.respondent_age,
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
        completed_at: data.completed_at?.toDate?.()?.toISOString() || data.completed_at
      });
    });
    
    console.log('🔍 Sessões encontradas:', sessions.length);
    sessions.forEach((session, index) => {
      console.log(`🔍 Sessão ${index + 1}:`, session);
    });
    
    res.json({
      total: sessions.length,
      sessions: sessions
    });
    
  } catch (error) {
    console.error('❌ Erro no debug das sessões:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Dashboard com estatísticas gerais
app.get('/api/statistics', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Gerando estatísticas...');
    
    const stats = {};

    // Contar usuários
    const usersSnapshot = await db.collection('users').get();
    stats.totalUsers = usersSnapshot.size;

    // Contar questionários ativos
    const questionnairesSnapshot = await db.collection('questionnaires')
      .where('is_active', '==', true)
      .get();
    stats.totalQuestionnaires = questionnairesSnapshot.size;

    // Contar questões
    const questionsSnapshot = await db.collection('questions').get();
    stats.totalQuestions = questionsSnapshot.size;

    // Contar respostas
    const responsesSnapshot = await db.collection('responses').get();
    stats.totalResponses = responsesSnapshot.size;

    // Estatísticas por questionário
    stats.questionnaireStats = [];
    
    for (const questionnaireDoc of questionnairesSnapshot.docs) {
      const questionnaireData = questionnaireDoc.data();
      
      // Contar questões deste questionário
      const questionsCount = await db.collection('questions')
        .where('questionnaire_id', '==', questionnaireDoc.id)
        .get();

      // Contar respostas deste questionário
      const questionIds = [];
      questionsCount.forEach(doc => questionIds.push(doc.id));
      
      let responsesCount = 0;
      if (questionIds.length > 0) {
        // Buscar respostas em lotes devido ao limite do Firestore
        const batchSize = 10;
        for (let i = 0; i < questionIds.length; i += batchSize) {
          const batch = questionIds.slice(i, i + batchSize);
          const responsesSnapshot = await db.collection('responses')
            .where('question_id', 'in', batch)
            .get();
          responsesCount += responsesSnapshot.size;
        }
      }

      stats.questionnaireStats.push({
        id: questionnaireDoc.id,
        title: questionnaireData.title,
        questionsCount: questionsCount.size,
        responsesCount
      });
    }

    console.log('✅ Estatísticas geradas');
    res.json(stats);

  } catch (error) {
    console.error('❌ Erro ao gerar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// =========================================================
// NOVA ROTA: DADOS DO DASHBOARD (Adicione no final do arquivo)
// =========================================================

app.get('/api/dashboard-data', authenticateToken, async (req, res) => {
  try {
    console.log('📊 Buscando dados para o Dashboard (Nova Rota)...');
    
    // 1. Contar Usuários
    const usersSnap = await db.collection('users').get();
    
    // 2. Contar Questionários Ativos
    const questsSnap = await db.collection('questionnaires').get();
    let activeQuests = 0;
    questsSnap.forEach(doc => {
        const data = doc.data();
        if (data.is_active !== false) activeQuests++;
    });

    // 3. Contar Respostas (Tenta Sessões primeiro, depois Respostas individuais)
    let totalResponses = 0;
    try {
        // Tenta contar sessões (questionários completos)
        const sessionsSnap = await db.collection('response_sessions').get();
        totalResponses = sessionsSnap.size;
        
        // Se der zero, tenta contar respostas individuais como garantia
        if (totalResponses === 0) {
             const responsesSnap = await db.collection('responses').get();
             totalResponses = responsesSnap.size;
        }
    } catch (e) {
        console.log('Tentando contagem alternativa de respostas...');
        const responsesSnap = await db.collection('responses').get();
        totalResponses = responsesSnap.size;
    }

    const stats = {
      totalUsers: usersSnap.size,
      totalQuestionnaires: activeQuests,
      totalResponses: totalResponses
    };

    console.log('✅ Dados do Dashboard enviados:', stats);
    res.json(stats);

  } catch (error) {
    console.error('❌ Erro no Dashboard:', error);
    // Retorna zero em vez de erro para não travar a tela
    res.json({ totalUsers: 0, totalQuestionnaires: 0, totalResponses: 0 });
  }
});

// === INICIALIZAÇÃO DO SERVIDOR ===

// Função para inicializar estruturas do banco
async function initializeDatabaseStructures() {
  try {
    console.log('🔧 Verificando estruturas do banco de dados...');
    
    // Verificar se já existe dados
    const collections = ['users', 'questionnaires', 'questions', 'responses'];
    
    // Criar questionários de exemplo se não existirem
    const questionnaireSnapshot = await db.collection('questionnaires').limit(1).get();
    
    if (questionnaireSnapshot.empty) {
      console.log('📝 Criando questionários de exemplo com estrutura NoSQL embedded...');
      
      // Questionário 1 - COM QUESTÕES EMBEDDED
      await db.collection('questionnaires').add({
        title: 'Pesquisa de Satisfação - Serviços para Idosos',
        description: 'Avalie a qualidade dos serviços oferecidos para a terceira idade em nossa comunidade',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
        is_active: true,
        questions: [  // 🔥 QUESTÕES DENTRO DO DOCUMENTO!
          {
            id: 'q1',
            text: 'Como você avalia o atendimento que recebeu?',
            type: 'rating',
            options: null,
            order: 1,
            is_required: true
          },
          {
            id: 'q2',
            text: 'Você recomendaria nossos serviços para outros idosos?',
            type: 'yes_no',
            options: null,
            order: 2,
            is_required: true
          },
          {
            id: 'q3',
            text: 'Qual aspecto do atendimento você considera mais importante?',
            type: 'multiple_choice',
            options: ['Rapidez no atendimento', 'Gentileza dos funcionários', 'Clareza nas informações', 'Ambiente acolhedor', 'Facilidade de acesso'],
            order: 3,
            is_required: true
          }
        ]
      });
      
      // Questionário 2 - COM QUESTÕES EMBEDDED
      await db.collection('questionnaires').add({
        title: 'Avaliação de Acessibilidade',
        description: 'Como podemos melhorar a acessibilidade dos nossos serviços?',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
        is_active: true,
        questions: [  // 🔥 QUESTÕES DENTRO DO DOCUMENTO!
          {
            id: 'q1',
            text: 'Como você avalia a facilidade de acesso ao nosso local?',
            type: 'rating',
            options: null,
            order: 1,
            is_required: true
          },
          {
            id: 'q2',
            text: 'Que melhorias de acessibilidade você sugere?',
            type: 'text',
            options: null,
            order: 2,
            is_required: false
          }
        ]
      });
      
      console.log('✅ Questionários com estrutura NoSQL embedded criados!');
    } else {
      console.log('✅ Questionários já existem');
    }
  } catch (error) {
    console.error('❌ Erro ao inicializar estruturas:', error);
    throw error;
  }
}

// Inicializar o servidor
async function initializeServer() {
  try {
    console.log('🚀 Iniciando servidor...');
    
    // Criar usuário admin se não existir
    await createAdminUser();
    
    // Inicializar banco de dados automaticamente
    console.log('🔧 Inicializando estruturas do banco de dados...');
    try {
      // Simular uma requisição para o endpoint de inicialização
      await initializeDatabaseStructures();
    } catch (initError) {
      console.error('⚠️  Erro ao inicializar banco (continuando):', initError.message);
    }
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Servidor rodando na porta ${PORT} em todos os interfaces`);
      console.log(`🌐 Health check (local): http://localhost:${PORT}/api/health`);
      console.log(`🌐 Health check (Wi-Fi): http://172.20.10.4:${PORT}/api/health`);
      console.log(`📱 Para React Native: http://172.20.10.4:${PORT}/api/health`);
      console.log(`🧪 Network test: http://172.20.10.4:${PORT}/api/network-test`);
      console.log(`🔧 Database test: http://172.20.10.4:${PORT}/api/database-test`);
    });
  } catch (error) {
    console.error('❌ Erro ao inicializar servidor:', error);
    process.exit(1);
  }
}

// Função para criar usuário admin inicial
async function createAdminUser() {
  try {
    console.log('👑 Verificando usuário admin...');
    
    const adminSnapshot = await db.collection('users')
      .where('username', '==', 'admin')
      .limit(1)
      .get();

    if (adminSnapshot.empty) {
      console.log('👑 Criando usuário admin...');
      
      const adminPassword = 'admin123'; // ALTERE ISSO EM PRODUÇÃO!
      const password_hash = await bcrypt.hash(adminPassword, 12);
      
      await db.collection('users').add({
        username: 'admin',
        full_name: 'Administrador',
        email: 'admin@vivamais.com',
        password_hash,
        role: 'admin',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
        is_active: true
      });
      
      console.log('✅ Usuário admin criado com sucesso!');
      console.log('📝 Login: admin / Senha: admin123');
      console.log('⚠️  ALTERE A SENHA EM PRODUÇÃO!');
    } else {
      console.log('✅ Usuário admin já existe');
    }
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
  }
}

// Tratamento de erros não capturados
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// ==========================================
// ROTA DE INTELIGÊNCIA ARTIFICIAL (INSIGHTS)
// ==========================================

const { OpenAI } = require('openai');

// Configure sua chave aqui (ou deixe vazio para usar o modo Simulado Grátis)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'SUA_CHAVE_AQUI_SE_TIVER', 
  dangerouslyAllowBrowser: true 
});

app.post('/api/generate-insights', authenticateToken, async (req, res) => {
  try {
    const { questionnaireId } = req.body;
    console.log(`🧠 Gerando insights para o questionário: ${questionnaireId}`);

    // 1. Busca as Perguntas e Respostas no Banco
    const qDoc = await db.collection('questionnaires').doc(questionnaireId).get();
    const qData = qDoc.data();
    
    // Busca respostas
    // (Simplificado: busca as últimas 50 para não estourar o limite da IA)
    const responsesSnap = await db.collection('responses')
      .where('question_id', '>=', '') // Truque para pegar varias
      .limit(50) 
      .get();

    // Se não tiver respostas suficientes, avisa
    if (responsesSnap.empty) {
        return res.json({ 
            success: true, 
            analysis: {
                strengths: ["Ainda não há dados suficientes."],
                improvements: ["Aguarde mais respostas."],
                action_plan: ["Divulgue o questionário."]
            }
        });
    }

    // --- MODO: INTELIGÊNCIA ARTIFICIAL 
    if (process.env.OPENAI_API_KEY) {
        AIzaSyBc6PXjweUCxBRd49RwivsuDjS07pZhoJ4
    }

    // --- MODO: ANÁLISE ESTATÍSTICA (GRÁTIS - SIMULAÇÃO) ---
    // Este algoritmo analisa os números reais do seu banco para gerar o insight
    
    let totalScore = 0;
    let countRating = 0;
    let negativeComments = 0;

    responsesSnap.forEach(doc => {
        const r = doc.data();
        if (r.numeric_value) {
            totalScore += r.numeric_value;
            countRating++;
        }
        // Simula análise de sentimento básica
        if (r.value && (r.value.includes('ruim') || r.value.includes('demora') || r.value.includes('não'))) {
            negativeComments++;
        }
    });

    const average = countRating > 0 ? (totalScore / countRating).toFixed(1) : 0;
    
    // Gera o texto baseado nos dados reais
    const analysis = {
        strengths: [],
        improvements: [],
        action_plan: []
    };

    if (average >= 4) {
        analysis.strengths.push("Alta satisfação geral dos usuários (Média acima de 4.0).");
        analysis.strengths.push("O serviço está sendo bem avaliado.");
        analysis.action_plan.push("Manter o padrão de qualidade atual.");
    } else {
        analysis.improvements.push("A satisfação geral está baixa (Média abaixo de 4.0).");
        analysis.action_plan.push("Investigar os motivos das notas baixas.");
    }

    if (negativeComments > 0) {
        analysis.improvements.push(`Foram detectados ${negativeComments} comentários com palavras negativas.`);
        analysis.action_plan.push("Ler os comentários de texto livre com atenção.");
    } else {
        analysis.strengths.push("Poucos ou nenhum comentário negativo detectado.");
    }

    // Adiciona algo genérico se faltar dados
    if (analysis.strengths.length === 0) analysis.strengths.push("Ainda coletando dados para definir pontos fortes.");
    
    console.log('✅ Insights gerados com sucesso');
    res.json({ success: true, analysis });

  } catch (error) {
    console.error('❌ Erro na IA:', error);
    res.status(500).json({ error: 'Erro ao gerar insights' });
  }
});

// Iniciar o servidor
initializeServer();