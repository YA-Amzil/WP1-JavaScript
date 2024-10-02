// test/data.test.js
const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// Middleware to parse JSON
app.use(express.json());

// Import the router
const dataRouter = require('../routes/data');
app.use('/data', dataRouter);

// Mock the database by creating a temporary config file
const mockConfigPath = path.join(__dirname, 'mock_config.json');
const mockData = [
    {
        route: 'person',
        properties: ['id', 'name', 'age', 'petIds'],
        data: [
            { id: 1, name: 'tim', age: 11, petIds: [1, 2] },
            { id: 2, name: 'sofie', age: 8, petIds: [] }
        ]
    },
    {
        route: 'pet',
        properties: ['id', 'name'],
        data: [
            { id: 1, name: 'bliksem' },
            { id: 2, name: 'duvel' }
        ]
    }
];

beforeAll((done) => {
    fs.writeFile(mockConfigPath, JSON.stringify(mockData, null, 2), (err) => {
        if (err) return done(err);
        done();
    });
});

afterAll((done) => {
    fs.unlink(mockConfigPath, (err) => {
        if (err) console.error("Failed to delete mock config file:", err);
        done();
    });
});

// Test GET /data/person
test('GET /data/person should return person data', async () => {
    const response = await request(app)
        .get('/data/person')
        .set('config', mockConfigPath); // Simulate the config file argument

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([
        { id: 1, name: 'tim', age: 11, petIds: [1, 2] },
        { id: 2, name: 'sofie', age: 8, petIds: [] }
    ]);
});

// Test DELETE /data/person/:id
test('DELETE /data/person/1 should delete the person', async () => {
    const response = await request(app)
        .delete('/data/person/1')
        .set('config', mockConfigPath); // Simulate the config file argument

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Object deleted');
});

// Test PATCH /data/person/:id
test('PATCH /data/person/2 should update the person', async () => {
    const response = await request(app)
        .patch('/data/person/2')
        .send({ name: 'Sofie gewijzigd', age: 9 })
        .set('config', mockConfigPath); // Simulate the config file argument

    expect(response.statusCode).toBe(200);
    expect(response.body.name).toBe('Sofie gewijzigd');
    expect(response.body.age).toBe(9);
});

// Test Full-text search
test('GET /data/search?q=Sofie should return search results', async () => {
    const response = await request(app)
        .get('/data/search?q=Sofie')
        .set('config', mockConfigPath); // Simulate the config file argument

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(1);
});

// Test GET /data/pet
test('GET /data/pet should return pet data', async () => {
    const response = await request(app)
        .get('/data/pet')
        .set('config', mockConfigPath); // Simulate the config file argument

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([
        { id: 1, name: 'bliksem' },
        { id: 2, name: 'duvel' }
    ]);
});

// Test DELETE /data/pet/:id
test('DELETE /data/pet/1 should delete the pet', async () => {
    const response = await request(app)
        .delete('/data/pet/1')
        .set('config', mockConfigPath); // Simulate the config file argument

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Object deleted');
});

// Test PATCH /data/pet/:id
test('PATCH /data/pet/2 should update the pet', async () => {
    const response = await request(app)
        .patch('/data/pet/2')
        .send({ name: 'Duvel gewijzigd' })
        .set('config', mockConfigPath); // Simulate the config file argument

    expect(response.statusCode).toBe(200);
    expect(response.body.name).toBe('Duvel gewijzigd');
});

// Test for non-existing route
test('GET /data/non-existing should return 404', async () => {
    const response = await request(app).get('/data/non-existing').set('config', mockConfigPath);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe('Route not found');
});
