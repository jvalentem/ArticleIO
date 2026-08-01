const mongoose = require('mongoose');
const Conexao = require('./conexao.js');
const stablishConnection = new Conexao();
const Users = require('./users.js');
const Posts = require('./posts.js')
let err = ''

function senhaIgual(senha, confirmacao){
    (senha != confirmacao)? err='As senhas não são iguais!' : ''
    
    return senha == confirmacao;
}

function existeUser(usernamePretendido, databaseData){
    let existe = false
    databaseData.map((valores)=>{
        
        if(usernamePretendido == valores.username){
        existe = true
        err = `O user ${usernamePretendido} já está em uso, tente outro.`
        return;
        }
    })
    return existe;
}

function maiorDe18(idade){
    (idade < 18)? err='Para prosseguir com o cadsastro o usuário deve ser maior de 18 anos' : ''
    return idade >= 18
}


function emailJaExiste(emailPretendido, databaseData){
    
    let existe = false
    databaseData.map((valores)=>{
        if(emailPretendido == valores.email){
            err = 'O email já está em uso! <a href="">Esqueceu sua senha?</a>'  
            existe = true
            return;
        }
    })

    return existe;
}

function senhaForte(senha){
    !(/[A-Za-z]/.test(senha) && senha.length > 8)? err = 'A senha deve ter mais de 8 caracteres incluindo letras e números.' : '';
    return (/[A-Za-z]/.test(senha) && senha.length > 8);
}


function tratarRegistro(registro, databaseData){

    let verifySenhaIgual = senhaIgual(registro.password,registro.confirmacao);
    let verifyMaiorDe18 = maiorDe18(registro.idade)
    let verifyEmailJaExiste = emailJaExiste(registro.email,databaseData);
    let verifyUserJaExiste = existeUser(registro.username,databaseData)
    let verifySenhaForte = senhaForte(registro.password);

    console.log('log de registro: ')
    console.log('senha igual: ' + verifySenhaIgual)
    console.log('maior de 18: ', verifyMaiorDe18)
    console.log('email ja cadastrado: ', verifyEmailJaExiste)
    console.log('user ja existe: ', verifyUserJaExiste )
    console.log('senha forte:', verifySenhaForte)

    const relatorio = {
        registroValidado: (verifySenhaIgual && !verifyUserJaExiste && !verifyEmailJaExiste && verifyMaiorDe18 && verifySenhaForte),
        err: err
    }

    return relatorio
}

class Tratamento {
    
    constructor(){}

    modifySlug(slug,howMany){
        if(!slug || !howMany){
            throw "Um dos parametros está faltando";
            return;
        }
        slug = slug + '-' + parseInt(howMany + 1)
        return slug
    } 

    registroLog(registro, databaseData){
        return tratarRegistro(registro,databaseData);
    }

    createNewSlug(postExistente, slug){
        while(postExistente.slug == slug)
        {
        console.log('slug existente, criando um novo')
        let i = 1
        const postExistente = Posts.findOne({slug: slug})
        slug = this.modifySlug(slug,i)
        console.log('novo slug: ' + slug)
        }
        return slug
    }
}


module.exports = Tratamento;