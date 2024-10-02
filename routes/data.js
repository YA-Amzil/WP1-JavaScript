const express = require('express');
const router = express.Router();
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const fs = require('fs');

// Use yargs to parse command line arguments and get the config file path
const argv = yargs(hideBin(process.argv)).argv;
const configFilePath = argv.config || './config.json';
// In-memory database for data storage
let db = [];

fs.readFile('./config.json', 'utf8', (err, data) => {
    if (err) {
        console.error("Failed to read config file: ", err);
        return;
    }
    db = JSON.parse(data);
    console.log("Database loaded, contains: ", db);
});

// The DB will be saved to the config file when the server is stopped with ctrl+c
process.on('SIGINT', () => {
    fs.writeFile(configFilePath, JSON.stringify(db, null, 2), 'utf8', (err) => {
        if (err) {
            console.error("Failed to save database: ", err);
        } else {
            console.log("Database saved successfully.");
        }
        process.exit();
    });
});

// GET /data/route - Return the data for the specified route
router.get('/:route', (req, res) => {
    const { route } = req.params;

    // Handle search functionality
    if (route === 'search') {
        const search = req.query.q;
        if (!search) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const searchResults = db
            .map(e => e.data.filter(obj => 
                Object.values(obj).some(val => 
                    typeof val === 'string' && val.toLowerCase().includes(search.toLowerCase())
                )
            ))
            .flat();

            if (searchResults.length === 0) {
                return res.status(404).json({ message: 'No results found' });
            }
            else{
                return res.status(200).json(searchResults);
            }
    }
    else{
        
        // Handle route data retrieval
        const entry = db.find(e => e.route === route);
        if (entry) {
            res.status(200).json(entry.data);
        } else {
            res.status(404).json({ message: 'Route not found' });
        }
    }

    
});

// DELETE /data/route/:id - Delete the data for the specified route
router.delete('/:route/:id', (req, res) => {
    const { route, id } = req.params;
    const entry = db.find(e => e.route === route);

    if (entry) {
        const index = entry.data.findIndex(obj => obj.id == id); // Use == to allow type coercion

        if (index !== -1) {
            entry.data.splice(index, 1);
            return res.status(200).json({ message: 'Object deleted' });
        } else {
            return res.status(404).json({ message: 'ID not found' });
        }
    } else {
        res.status(404).json({ message: 'Route not found' });
    }
});

// PATCH /data/route/:id - Update the data for the specified route
router.patch('/:route/:id', (req, res) => {
    const { route, id } = req.params;
    const entry = db.find(e => e.route === route);

    if (!entry) {
        return res.status(404).json({ message: 'Route not found' });
    }

    const obj = entry.data.find(obj => obj.id == id); // Use == to allow type coercion
    if (!obj) {
        return res.status(404).json({ message: 'ID not found' });
    }

    const allowedFields = entry.properties;
    const updates = Object.keys(req.body);

    const isValidOperation = updates.every(update => allowedFields.includes(update));
    if (!isValidOperation) {
        return res.status(400).json({ message: 'Invalid fields: ' + updates.join(', ') });
    }

    updates.forEach(update => obj[update] = req.body[update]);
    res.status(200).json(obj);
});

// Export the router
module.exports = router;