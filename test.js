const { SmotretAnimeAPI, UserSession } = require('anime365wrapper');

async function testLibrary() {
    console.log('🚀 Начинаем тестирование библиотеки anime365wrapper...\n');

    try {
        // Тест 1: Создание экземпляра SmotretAnimeAPI
        console.log('📋 Тест 1: Создание экземпляра SmotretAnimeAPI');
        const api = new SmotretAnimeAPI();
        console.log('✅ SmotretAnimeAPI создан успешно');
        console.log('   - baseUrl:', api.baseUrl || 'не доступен (приватное поле)');
        console.log('   - userAgent:', api.userAgent || 'не доступен (приватное поле)');
        console.log();

        // Тест 2: Создание экземпляра UserSession
        console.log('📋 Тест 2: Создание экземпляра UserSession');
        const session = new UserSession();
        console.log('✅ UserSession создан успешно');
        console.log();

        // Тест 3: Проверка методов API (без авторизации)
        console.log('📋 Тест 3: Проверка доступности методов API');
        
        // Проверим, что методы существуют
        const methods = [
            'setAccessToken',
            'login',
            'getTranslations',
            'getTranslationById',
            'getTranslationEmbed',
            'getSeriesList',
            'getSeriesById',
            'getEpisodeById',
            'getCurrentUser'
        ];

        methods.forEach(method => {
            if (typeof api[method] === 'function') {
                console.log(`✅ Метод ${method} доступен`);
            } else {
                console.log(`❌ Метод ${method} недоступен`);
            }
        });
        console.log();

        // Тест 4: Попытка получить список переводов (публичный эндпоинт)
        console.log('📋 Тест 4: Тест публичного API (получение переводов)');
        try {
            const translations = await api.getTranslations('recent');
            console.log('✅ Получение переводов успешно');
            console.log(`   - Получено переводов: ${translations.length}`);
            if (translations.length > 0) {
                console.log(`   - Первый перевод ID: ${translations[0].id || 'неизвестно'}`);
            }
        } catch (error) {
            console.log('❌ Ошибка при получении переводов:', error.message);
        }
        console.log();

        // Тест 5: Попытка получить список серий
        console.log('📋 Тест 5: Тест получения списка серий');
        try {
            const series = await api.getSeriesList({ limit: 5 });
            console.log('✅ Получение списка серий успешно');
            console.log(`   - Получено серий: ${series.length}`);
            if (series.length > 0) {
                console.log(`   - Первая серия ID: ${series[0].id || 'неизвестно'}`);
                console.log(`   - Первая серия название: ${series[0].title || 'неизвестно'}`);
            }
        } catch (error) {
            console.log('❌ Ошибка при получении серий:', error.message);
        }
        console.log();

        // Тест 6: Проверка UserSession методов
        console.log('📋 Тест 6: Проверка методов UserSession');
        const sessionMethods = ['setAccessToken', 'login', 'getTranslations'];
        sessionMethods.forEach(method => {
            if (typeof session[method] === 'function') {
                console.log(`✅ UserSession метод ${method} доступен`);
            } else {
                console.log(`❌ UserSession метод ${method} недоступен`);
            }
        });
        console.log();

        console.log('🎉 Тестирование завершено!');

    } catch (error) {
        console.error('💥 Критическая ошибка при тестировании:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Запускаем тест
testLibrary().catch(console.error);
