import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('little_lemon');

export async function createTable() {
    try {
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS menuitems (
                id INTEGER PRIMARY KEY NOT NULL, 
                name TEXT, 
                price TEXT, 
                description TEXT, 
                image TEXT, 
                category TEXT
            );
        `);
        return Promise.resolve();
    } catch (error) {
        return Promise.reject(error);
    }
}

export async function getMenuItems() {
    try {
        return  await db.getAllAsync('SELECT * FROM menuitems');
    } catch (error) {
        throw error;
    }
}

export async function saveMenuItems(menuItems) {
    if (!Array.isArray(menuItems) || menuItems.length === 0) {
        throw new Error('Invalid menu items data');
    }

    try {
        await db.withTransactionAsync(async () => {
            const statement = await db.prepareAsync(
                'INSERT INTO menuitems (id, name, price, description, image, category) VALUES (?, ?, ?, ?, ?, ?)'
            );

            for (const item of menuItems) {
                await statement.executeAsync([
                    item.id,
                    item.name,
                    item.price,
                    item.description,
                    item.image,
                    item.category
                ]);
            }

            await statement.finalizeAsync();
        });
    } catch (error) {
        throw error;
    }
}

export async function filterByQueryAndCategories(query, activeCategories) {
    if (!activeCategories || activeCategories.length === 0) {
        return [];
    }

    try {
        const placeholders = activeCategories.map(() => '?').join(', ');
        const params = [`%${query}%`, ...activeCategories];

        return  await db.getAllAsync(
            `SELECT * FROM menuitems WHERE name LIKE ? AND category IN (${placeholders})`,
            params
        );
    } catch (error) {
        throw error;
    }
}
