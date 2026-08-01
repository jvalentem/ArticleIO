const mongoose = require('mongoose')

let Schema = mongoose.Schema;

const userSchema = new Schema({
    username: String,
    nome: String,
    password: String,
    dataEntrada: {type:String, default: new Date().toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'})},
    numeroDePosts: {type:Number, default:0},
    email: String,
    acesso:{type:String, default:'Escritor'}
    
},{collection:'users'});

let Users = mongoose.model("Users",userSchema)

module.exports = Users

// const mongoose = require('mongoose');
// var Schema = mongoose.Schema;

// const postSchema = new Schema({
//     titulo: String,
//     introducao: String,
//     autor: String,
//     categoria: String,
//     desenvolvimento: String,
//     imagem: String,
//     slug: String,
//     views: {type:Number, default:0},
//     dataPub: String
// },{collection:'posts'})

// var Posts = mongoose.model("Posts",postSchema);


// module.exports = Posts;