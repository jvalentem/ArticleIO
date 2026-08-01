const mongoose = require('mongoose');
var Schema = mongoose.Schema;

const postSchema = new Schema({
    titulo: String,
    introducao: String,
    desenvolvimentos: [{
        titulo_desenvolvimento: [String],
        conteudo: [String],
        imagem: [String]
    }],
    autor: String,
    categoria: String,
    imagem: {type:String, default:'https://i.pinimg.com/736x/e0/9e/cf/e09ecf2dd932af7450bd08f825e432a3.jpg'},
    slug: String,
    views: {type:Number, default:0},
    dataPub: {type:String, default: new Date().toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'})},
    fonte:String,
    descricao_curta: String
},{collection:'posts'})

var Posts = mongoose.model("Posts",postSchema);

module.exports = Posts;