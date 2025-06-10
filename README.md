# Crypto Demo

A blockchain demonstration application that implements the UTXO (Unspent Transaction Output) model, similar to Bitcoin's transaction system. This project showcases key blockchain concepts including transaction creation, mining, and peer management.

## Features

### UTXO Model
- Users can create transactions by selecting specific UTXOs to spend
- Change is automatically calculated and returned to the sender
- Transaction fees are supported
- UTXOs are properly tracked and spent

### Mining
- Proof of Work implementation with difficulty (hash starting with '000')
- Mining rewards for successful block creation
- Ability to select transactions to include in a block
- Block linking through previous hash references

### Peer Management
- Dynamic peer addition with initial balance
- Each new peer gets their own block in the blockchain
- Proper transaction history for all peer interactions

### Transaction System
- Create transactions between peers
- Select specific UTXOs to spend
- Automatic change calculation
- Transaction fee support
- Transaction status tracking (pending/confirmed)

## Technical Implementation

### Blockchain Structure
- Genesis block with initial coin distribution
- Proof of Work mining with difficulty requirement
- Block linking through hash references
- Transaction history preservation

### UTXO Management
- Unique UTXO identification
- Proper spending and creation of UTXOs
- Balance calculation based on unspent UTXOs
- Transaction input/output tracking

### Security Features
- Cryptographic hash generation for blocks and transactions
- Proof of Work difficulty requirement
- Transaction validation
- UTXO spending validation

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Creating Transactions**
   - Select a sender and recipient
   - Choose UTXOs to spend
   - Enter amount and transaction fee
   - Create transaction

2. **Mining Blocks**
   - Select pending transactions
   - Click "Mine Block"
   - Wait for proof of work completion
   - Receive mining reward

3. **Adding New Peers**
   - Enter peer name and initial balance
   - Click "Add Peer"
   - New peer will be added with their own block

## Technologies Used

- React
- Next.js
- Tailwind CSS
- Crypto-js for hashing

## License

MIT
