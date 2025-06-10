"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { Coins, Pickaxe, Send, User, Hash, Clock, CheckCircle } from 'lucide-react';
import { createHash } from 'crypto';

const CryptoDemoClone = () => {
  const [users, setUsers] = useState({
    Alice: { balance: 30, utxos: [] },
    Bob: { balance: 30, utxos: [] },
    Charlie: { balance: 20, utxos: [] }
  });
  
  const [activeUser, setActiveUser] = useState('Alice');
  const [blockchain, setBlockchain] = useState([]);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [mining, setMining] = useState(false);
  const [miningReward] = useState(10);
  
  const [recipient, setRecipient] = useState('Bob');
  const [amount, setAmount] = useState('');
  const [transactionFee, setTransactionFee] = useState(1);
  const [selectedUtxos, setSelectedUtxos] = useState([]);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [newPeerName, setNewPeerName] = useState('');
  const [newPeerBalance, setNewPeerBalance] = useState('');

  useEffect(() => {
    // Generate genesis block hash with difficulty
    const genesisData = {
      id: 0,
      timestamp: Date.now(),
      transactions: [],
      previousHash: '0',
      nonce: 0
    };

    // Find nonce that satisfies difficulty
    let nonce = 0;
    let genesisHash = '';
    do {
      genesisData.nonce = nonce;
      genesisHash = generateHash(genesisData);
      nonce++;
    } while (!genesisHash.startsWith('000'));

    const genesisBlock = {
      ...genesisData,
      hash: genesisHash,
      miner: 'Genesis'
    };

    // Generate initial UTXOs with proper hashes
    const initialUtxos = {
      Alice: [
        {
          id: `utxo-alice-${Date.now()}-0`,
          amount: 30,
          txHash: genesisHash,
          outputIndex: 0,
          spent: false
        }
      ],
      Bob: [
        {
          id: `utxo-bob-${Date.now()}-0`,
          amount: 30,
          txHash: genesisHash,
          outputIndex: 1,
          spent: false
        }
      ],
      Charlie: [
        {
          id: `utxo-charlie-${Date.now()}-0`,
          amount: 20,
          txHash: genesisHash,
          outputIndex: 2,
          spent: false
        }
      ]
    };

    // Create initial transactions for the genesis block
    const genesisTransactions = Object.entries(initialUtxos).map(([user, utxos]) => ({
      id: generateHash({
        from: 'System',
        to: user,
        amount: utxos[0].amount,
        timestamp: Date.now()
      }),
      from: 'System',
      to: user,
      amount: utxos[0].amount,
      fee: 0,
      timestamp: Date.now(),
      inputs: [],
      outputs: [{
        recipient: user,
        amount: utxos[0].amount,
        utxoId: utxos[0].id
      }],
      status: 'confirmed'
    }));

    // Update genesis block with transactions
    genesisBlock.transactions = genesisTransactions;

    setUsers(prev => ({
      Alice: { ...prev.Alice, utxos: initialUtxos.Alice },
      Bob: { ...prev.Bob, utxos: initialUtxos.Bob },
      Charlie: { ...prev.Charlie, utxos: initialUtxos.Charlie }
    }));

    setBlockchain([genesisBlock]);
  }, []);

  // Generate transaction hash
  const generateHash = (data) => {
    const hash = createHash('sha256');
    hash.update(JSON.stringify(data));
    return hash.digest('hex');
  };

  // Create transaction
  const createTransaction = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    if (selectedUtxos.length === 0) {
      alert('Please select at least one UTXO to spend!');
      return;
    }

    const totalAmount = parseFloat(amount) + transactionFee;
    const selectedAmount = selectedUtxos.reduce((sum, utxo) => sum + utxo.amount, 0);
    
    if (selectedAmount < totalAmount) {
      alert('Insufficient funds in selected UTXOs!');
      return;
    }

    const txHash = generateHash({ from: activeUser, to: recipient, amount, timestamp: Date.now() });
    
    const inputs = selectedUtxos.map(utxo => ({
      utxoId: utxo.id,
      amount: utxo.amount,
      txHash: utxo.txHash,
      outputIndex: utxo.outputIndex
    }));

    const transaction = {
      id: txHash,
      from: activeUser,
      to: recipient,
      amount: parseFloat(amount),
      fee: transactionFee,
      timestamp: Date.now(),
      inputs: inputs,
      outputs: [],
      status: 'pending'
    };

    // Create outputs
    transaction.outputs.push({
      recipient: recipient,
      amount: parseFloat(amount),
      utxoId: `utxo-${recipient.toLowerCase()}-${Date.now()}-0`
    });

    // Create change output if needed
    const change = selectedAmount - totalAmount;
    if (change > 0) {
      transaction.outputs.push({
        recipient: activeUser,
        amount: change,
        utxoId: `utxo-${activeUser.toLowerCase()}-${Date.now()}-1`
      });
    }

    // Mark selected UTXOs as spent and update balances
    setUsers(prevUsers => {
      const newUsers = { ...prevUsers };
      
      // Mark UTXOs as spent and update sender's balance
      selectedUtxos.forEach(utxo => {
        const userUtxos = newUsers[activeUser].utxos;
        userUtxos.forEach(u => {
          if (u.id === utxo.id && !u.spent) {
            u.spent = true;
          }
        });
      });

      // Update balances for all users
      Object.keys(newUsers).forEach(user => {
        newUsers[user].balance = newUsers[user].utxos
          .filter(utxo => !utxo.spent)
          .reduce((sum, utxo) => sum + utxo.amount, 0);
      });

      return newUsers;
    });

    setPendingTransactions(prev => [...prev, transaction]);
    setAmount('');
    setSelectedUtxos([]);
  };

  // Mine block
  const mineBlock = useCallback(async () => {
    setMining(true);
    
    // // Simulate mining delay
    // await new Promise(resolve => setTimeout(resolve, 2000));
    
    const previousBlockHash = blockchain[blockchain.length - 1].hash;
    let nonce = 0;
    let hash = '';

    // Add mining reward transaction
    const rewardTx = {
      id: generateHash({ 
        miner: activeUser, 
        reward: miningReward,
        timestamp: Date.now(),
        blockId: blockchain.length
      }),
      from: 'System',
      to: activeUser,
      amount: miningReward,
      fee: 0,
      timestamp: Date.now(),
      inputs: [],
      outputs: [{
        recipient: activeUser,
        amount: miningReward,
        utxoId: `utxo-${activeUser.toLowerCase()}-mining-${blockchain.length}-${Date.now()}`
      }],
      status: 'confirmed'
    };

    // Combine selected transactions with reward transaction
    const blockTransactions = [...selectedTransactions, rewardTx];
    
    // Simple proof of work: find a hash starting with '000'
    do {
      const blockData = {
        id: blockchain.length,
        timestamp: Date.now(),
        transactions: blockTransactions.map(tx => tx.id),
        previousHash: previousBlockHash,
        nonce: nonce
      };
      hash = generateHash(blockData);
      nonce++;
    } while (!hash.startsWith('000'));

    const newBlock = {
      id: blockchain.length,
      timestamp: Date.now(),
      transactions: blockTransactions,
      previousHash: previousBlockHash,
      hash: hash,
      nonce: nonce - 1,
      miner: activeUser
    };

    // Process all transactions in the block
    setUsers(prevUsers => {
      const newUsers = { ...prevUsers };

      newBlock.transactions.forEach(tx => {
        if (tx.from !== 'System') {
          // Mark input UTXOs as spent
          tx.inputs.forEach(input => {
            const userUtxos = newUsers[tx.from].utxos;
            // Find all matching UTXOs and mark them as spent
            userUtxos.forEach(utxo => {
              if (utxo.id === input.utxoId && !utxo.spent) {
                utxo.spent = true;
              }
            });
          });
        }

        // Create new UTXOs from outputs
        tx.outputs.forEach(output => {
          // Check if UTXO already exists
          const existingUtxo = newUsers[output.recipient].utxos.find(
            u => u.id === output.utxoId
          );
          
          if (!existingUtxo) {
            newUsers[output.recipient].utxos.push({
              id: output.utxoId,
              amount: output.amount,
              txHash: tx.id,
              outputIndex: 0,
              spent: false
            });
          }
        });

        // Update balances
        Object.keys(newUsers).forEach(user => {
          newUsers[user].balance = newUsers[user].utxos
            .filter(utxo => !utxo.spent)
            .reduce((sum, utxo) => sum + utxo.amount, 0);
        });
      });

      return newUsers;
    });

    setBlockchain(prev => [...prev, newBlock]);
    setPendingTransactions(prev => prev.filter(tx => !selectedTransactions.some(st => st.id === tx.id)));
    setSelectedTransactions([]);
    setMining(false);
  }, [selectedTransactions, blockchain, activeUser, miningReward]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getAvailableUtxos = (user) => {
    // Filter out spent UTXOs and ensure unique UTXOs
    const utxos = users[user].utxos.filter(utxo => !utxo.spent);
    // Use a Map to ensure uniqueness based on UTXO ID
    const uniqueUtxos = new Map();
    utxos.forEach(utxo => {
      if (!uniqueUtxos.has(utxo.id)) {
        uniqueUtxos.set(utxo.id, utxo);
      }
    });
    return Array.from(uniqueUtxos.values());
  };

  const addNewPeer = () => {
    if (!newPeerName || !newPeerBalance || parseFloat(newPeerBalance) <= 0) {
      alert('Please enter a valid name and balance for the new peer!');
      return;
    }

    if (users[newPeerName]) {
      alert('A peer with this name already exists!');
      return;
    }

    const initialBalance = parseFloat(newPeerBalance);
    const utxoId = `utxo-${newPeerName.toLowerCase()}-${Date.now()}`;

    // Create transaction for new peer
    const newPeerTx = {
      id: generateHash({
        from: 'System',
        to: newPeerName,
        amount: initialBalance,
        timestamp: Date.now()
      }),
      from: 'System',
      to: newPeerName,
      amount: initialBalance,
      fee: 0,
      timestamp: Date.now(),
      inputs: [],
      outputs: [{
        recipient: newPeerName,
        amount: initialBalance,
        utxoId: utxoId
      }],
      status: 'confirmed'
    };

    // Create new block for the transaction with difficulty
    const previousBlockHash = blockchain[blockchain.length - 1].hash;
    const blockData = {
      id: blockchain.length,
      timestamp: Date.now(),
      transactions: [newPeerTx.id],
      previousHash: previousBlockHash,
      nonce: 0
    };

    // Find nonce that satisfies difficulty
    let nonce = 0;
    let blockHash = '';
    do {
      blockData.nonce = nonce;
      blockHash = generateHash(blockData);
      nonce++;
    } while (!blockHash.startsWith('000'));

    const newBlock = {
      ...blockData,
      transactions: [newPeerTx],
      hash: blockHash,
      miner: 'System'
    };

    // Update blockchain and users
    setBlockchain(prev => [...prev, newBlock]);
    setUsers(prev => ({
      ...prev,
      [newPeerName]: {
        balance: initialBalance,
        utxos: [{
          id: utxoId,
          amount: initialBalance,
          txHash: newPeerTx.id,
          outputIndex: 0,
          spent: false
        }]
      }
    }));

    setNewPeerName('');
    setNewPeerBalance('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
            <Coins className="text-yellow-400" />
            Crypto Demo
          </h1>
          <p className="text-gray-300">Experience blockchain transactions with UTXO model</p>
        </div>

        {/* Add New Peer Form */}
        <div className="mb-8 bg-gray-800 rounded-xl p-6 shadow-2xl">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <User className="text-blue-400" />
            Add New Peer
          </h2>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Peer Name</label>
              <input
                type="text"
                value={newPeerName}
                onChange={(e) => setNewPeerName(e.target.value)}
                placeholder="Enter peer name"
                className="w-full p-3 bg-gray-700 rounded-lg"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Initial Balance</label>
              <input
                type="number"
                value={newPeerBalance}
                onChange={(e) => setNewPeerBalance(e.target.value)}
                placeholder="Enter initial balance"
                className="w-full p-3 bg-gray-700 rounded-lg"
                min="0"
                step="0.01"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={addNewPeer}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-all"
              >
                Add Peer
              </button>
            </div>
          </div>
        </div>

        {/* User Selection */}
        <div className="mb-8">
          <div className="flex justify-center gap-4 flex-wrap">
            {Object.keys(users).map(user => (
              <button
                key={user}
                onClick={() => setActiveUser(user)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeUser === user
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <User className="inline mr-2" size={20} />
                {user} ({users[user].balance} coins)
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transaction Panel */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl p-6 shadow-2xl">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Send className="text-green-400" />
                Send Transaction
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">From</label>
                  <input
                    type="text"
                    value={activeUser}
                    disabled
                    className="w-full p-3 bg-gray-700 rounded-lg text-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">To</label>
                  <select
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full p-3 bg-gray-700 rounded-lg"
                  >
                    {Object.keys(users).filter(u => u !== activeUser).map(user => (
                      <option key={user} value={user}>{user}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Amount</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full p-3 bg-gray-700 rounded-lg"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Transaction Fee</label>
                  <input
                    type="number"
                    value={transactionFee}
                    onChange={(e) => setTransactionFee(parseFloat(e.target.value) || 0)}
                    className="w-full p-3 bg-gray-700 rounded-lg"
                    min="0"
                    step="0.1"
                  />
                </div>

                <button
                  onClick={createTransaction}
                  disabled={!amount || parseFloat(amount) <= 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed py-3 rounded-lg font-semibold transition-all"
                >
                  Create Transaction
                </button>
              </div>

              {/* Available UTXOs */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Available UTXOs</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {getAvailableUtxos(activeUser).map(utxo => (
                    <div 
                      key={utxo.id} 
                      className={`p-3 rounded-lg text-sm cursor-pointer transition-all ${
                        selectedUtxos.some(su => su.id === utxo.id) 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                      onClick={() => {
                        setSelectedUtxos(prev => {
                          const isSelected = prev.some(su => su.id === utxo.id);
                          if (isSelected) {
                            return prev.filter(su => su.id !== utxo.id);
                          } else {
                            return [...prev, utxo];
                          }
                        });
                      }}
                    >
                      <div className="flex justify-between">
                        <span className={selectedUtxos.some(su => su.id === utxo.id) ? 'text-white' : 'text-green-400'}>
                          {utxo.amount} coins
                        </span>
                        <span className={selectedUtxos.some(su => su.id === utxo.id) ? 'text-gray-200' : 'text-gray-400'}>
                          #{utxo.id.slice(-6)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedUtxos.length > 0 && (
                  <div className="mt-2 text-sm text-gray-300">
                    Selected: {selectedUtxos.reduce((sum, utxo) => sum + utxo.amount, 0)} coins
                  </div>
                )}
              </div>
            </div>

            {/* Mining Panel */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-2xl mt-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Pickaxe className="text-orange-400" />
                Mining
              </h2>
              
              <div className="text-center">
                <p className="mb-4 text-gray-300">
                  Pending Transactions: {pendingTransactions.length}
                </p>
                <p className="mb-4 text-gray-300">
                  Selected Transactions: {selectedTransactions.length}
                </p>
                <p className="mb-4 text-gray-300">
                  Mining Reward: {miningReward} coins
                </p>
                <button
                  onClick={mineBlock}
                  disabled={mining}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed py-3 rounded-lg font-semibold transition-all"
                >
                  {mining ? 'Mining...' : 'Mine Block'}
                </button>
              </div>
            </div>
          </div>

          {/* Blockchain and Transactions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Transactions */}
            {pendingTransactions.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-6 shadow-2xl">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Clock className="text-yellow-400" />
                  Pending Transactions
                </h2>
                <div className="space-y-3">
                  {pendingTransactions.map(tx => (
                    <div 
                      key={tx.id} 
                      className={`bg-yellow-900 border border-yellow-600 p-4 rounded-lg cursor-pointer transition-all ${
                        selectedTransactions.some(st => st.id === tx.id) ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => {
                        setSelectedTransactions(prev => {
                          const isSelected = prev.some(st => st.id === tx.id);
                          if (isSelected) {
                            return prev.filter(st => st.id !== tx.id);
                          } else {
                            return [...prev, tx];
                          }
                        });
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-semibold">{tx.from} → {tx.to}</span>
                          <span className="text-yellow-400 ml-2">{tx.amount} coins</span>
                        </div>
                        <span className="text-sm text-gray-300">{formatTime(tx.timestamp)}</span>
                      </div>
                      <div className="text-sm text-gray-300">
                        <Hash className="inline mr-1" size={14} />
                        {tx.id}
                      </div>
                      <div className="mt-2 text-sm text-gray-400">
                        <div>Inputs:</div>
                        {tx.inputs.map(input => (
                          <div key={input.utxoId} className="ml-2">
                            UTXO: {input.utxoId.slice(-6)} - {input.amount} coins
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {selectedTransactions.length > 0 && (
                  <div className="mt-4 text-sm text-gray-300">
                    Selected transactions: {selectedTransactions.length}
                  </div>
                )}
              </div>
            )}

            {/* Blockchain */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-2xl">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="text-green-400" />
                Blockchain
              </h2>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {[...blockchain].reverse().map(block => (
                  <div key={block.id} className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg">Block #{block.id}</h3>
                        <p className="text-sm text-gray-300">
                          Mined by: {block.miner} | {formatTime(block.timestamp)}
                        </p>
                      </div>
                      <span className="text-sm text-gray-400">
                        Nonce: {block.nonce}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-300 mb-3">
                      <Hash className="inline mr-1" size={14} />
                      {block.hash}
                    </div>

                    {block.transactions.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Transactions:</h4>
                        {block.transactions.map(tx => (
                          <div key={tx.id} className="bg-gray-600 p-3 rounded text-sm">
                            <div className="flex justify-between">
                              <span>{tx.from} → {tx.to}</span>
                              <span className="text-green-400">{tx.amount} coins</span>
                            </div>
                            {tx.fee > 0 && (
                              <div className="text-gray-400 text-xs">Fee: {tx.fee} coins</div>
                            )}
                            <div className="text-gray-400 text-xs mt-1">
                              {tx.outputs.map((output, index) => (
                                <div key={index} className="ml-2">
                                  {output.recipient}: {output.amount} coins
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoDemoClone;