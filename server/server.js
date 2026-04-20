import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import https from 'https';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Отключаем проверку SSL сертификата
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true
});

let cachedToken = null;
let tokenExpiry = null;

async function getAccessToken() {
  // Проверяем, есть ли валидный кэшированный токен
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    console.log('Используем кэшированный токен');
    return cachedToken;
  }

  try {
    console.log('Получение нового токена...');
    
    // Используем Authorization Key из .env
    const authKey = process.env.GIGACHAT_AUTH_KEY;
    
    console.log('Authorization Key (первые 20 символов):', authKey.substring(0, 20) + '...');
    
    const response = await axios({
      method: 'post',
      url: 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
      data: 'scope=GIGACHAT_API_PERS',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'RqUID': crypto.randomUUID(),
        'Authorization': `Basic ${authKey}`
      },
      httpsAgent,
      timeout: 30000
    });
    
    console.log('Токен успешно получен');
    
    if (response.data && response.data.access_token) {
      cachedToken = response.data.access_token;
      // Токен живет 30 минут, установим кэш на 25 минут
      tokenExpiry = Date.now() + 25 * 60 * 1000;
      console.log('Токен действителен до:', new Date(tokenExpiry).toLocaleTimeString());
      return cachedToken;
    } else {
      throw new Error('Не получен access_token в ответе');
    }
  } catch (error) {
    console.error('Ошибка получения токена:');
    if (error.response) {
      console.error('Статус:', error.response.status);
      console.error('Данные ошибки:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('Нет ответа от сервера');
    } else {
      console.error('Ошибка:', error.message);
    }
    throw new Error(`Не удалось получить токен: ${error.message}`);
  }
}

async function sendToGigaChat(message, accessToken) {
  try {
    console.log('Отправка сообщения в GigaChat...');
    
    const response = await axios({
      method: 'post',
      url: 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions',
      data: {
        model: 'GigaChat',
        messages: [
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        stream: false
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      httpsAgent,
      timeout: 60000
    });
    
    console.log('Ответ получен успешно');
    
    if (response.data && response.data.choices && response.data.choices[0]) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('Неожиданный формат ответа от GigaChat');
    }
  } catch (error) {
    console.error('Ошибка GigaChat:');
    if (error.response) {
      console.error('Статус:', error.response.status);
      console.error('Данные ошибки:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('Нет ответа от сервера');
    } else {
      console.error('Ошибка:', error.message);
    }
    throw new Error(`Ошибка GigaChat: ${error.message}`);
  }
}

// Тестовый эндпоинт для проверки работы сервера
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Эндпоинт для проверки авторизации
app.get('/api/test-auth', async (req, res) => {
  try {
    const token = await getAccessToken();
    res.json({ success: true, tokenLength: token.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Основной эндпоинт чата
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  
  console.log('\nПолучен запрос с сообщением:', message?.substring(0, 50));
  
  if (!message) {
    return res.status(400).json({ error: 'Сообщение не может быть пустым' });
  }
  
  try {
    // Получаем токен
    const accessToken = await getAccessToken();
    console.log('Токен получен');
    
    // Отправляем запрос в GigaChat
    const reply = await sendToGigaChat(message, accessToken);
    
    console.log('Ответ отправлен клиенту\n');
    res.json({ reply });
  } catch (error) {
    console.error('Ошибка в /api/chat:', error.message);
    res.status(500).json({ 
      error: error.message,
      details: 'Проверьте консоль сервера для деталей'
    });
  }
});

// Обработка несуществующих маршрутов
app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`\nСервер запущен на http://localhost:${PORT}`);
  console.log(`Тестовые эндпоинты:`);
  console.log(`   - Health: http://localhost:${PORT}/api/health`);
  console.log(`   - Test Auth: http://localhost:${PORT}/api/test-auth`);
  console.log(`   - Chat: POST http://localhost:${PORT}/api/chat\n`);
});