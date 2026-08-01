const mongoose = require('mongoose');
uriDoBanco = process.env.MONGO_URI



class Conexao{
    constructor(){
        const connect = async ()=>{
            try {
                
                await mongoose.connect(uriDoBanco)
                console.log('Conectado ao banco de dados')
            } catch (error) {
                console.log(`Erro ao conectar com o banco de dados: ${error}`);
            }
        }
        connect();
    }
}

module.exports = Conexao