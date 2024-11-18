require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const jukeboxABI = require('./abi.json');

const app = express();
app.use(cors());
app.use(express.json());

// Load environment variables
const CONTRACT_ADDRESS = '0xdD8E5956B0d3162cb673F70E217b7F5F3d3c6F6f';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;

// Set up ethers.js
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, jukeboxABI, wallet);

// Play song endpoint
app.post('/playSong', async (req, res) => {
    const { albumName, trackNumber, tokenAddress } = req.body;

    try {
        const tx = await contract.playSong(albumName, trackNumber, tokenAddress);
        await tx.wait();
        res.json({ message: 'Song played successfully!', txHash: tx.hash });
    } catch (error) {
        console.error('Error playing song:', error);
        res.status(500).json({ error: 'Failed to play song.' });
    }
});

// Play album endpoint
app.post('/playAlbum', async (req, res) => {
    const { albumName, tokenAddress } = req.body;

    try {
        const tx = await contract.playAlbum(albumName, tokenAddress);
        await tx.wait();
        res.json({ message: 'Album played successfully!', txHash: tx.hash });
    } catch (error) {
        console.error('Error playing album:', error);
        res.status(500).json({ error: 'Failed to play album.' });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});