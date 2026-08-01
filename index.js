const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const eSession = require('express-session');
const path = require('path');
const ejs = require('ejs');

require('node:dns/promises').setServers(['1.1.1.1', '8.8.8.8']);

dotenv.config();

const Posts = require('./posts.js');
const Users = require('./users.js');
const Conexao = require('./conexao.js');
const Tratamento = require('./tratamento.js');

const app = express();
const port = 3000;

new Conexao();
const tratamento = new Tratamento();

app.engine('html', ejs.renderFile);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(eSession({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: false,
    cookie: {
        maxAge: 10000000000,
        httpOnly: false
    }
}));

function formatPost(post) {
    return {
        titulo: post.titulo,
        introducao: post.introducao,
        autor: post.autor,
        categoria: post.categoria,
        desenvolvimento: post.desenvolvimento,
        imagem: post.imagem,
        slug: post.slug,
        views: post.views,
        descricao_curta: post.introducao ? post.introducao.substring(0, 100) : '',
        dataPub: post.dataPub
    };
}

function formatPosts(posts) {
    return posts.map(formatPost);
}

function isAuthenticated(req) {
    return Boolean(req.session && req.session.login);
}

function isAdmin(req) {
    return isAuthenticated(req) && req.session.login.acesso === 'admin';
}

function ensureAuthenticated(req, res, next) {
    if (!isAuthenticated(req)) {
        return res.redirect('/usuario/login');
    }
    next();
}

function ensureAdmin(req, res, next) {
    if (!isAdmin(req)) {
        return res.send('<h1 style="color:red">Acesso Negado.</h1>');
    }
    next();
}

function buildSlug(title) {
    return title
        .trim()
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^\w-]+/g, '');
}

app.listen(port, (error) => {
    if (error) throw error;
    console.log('servidor disponivel na porta', port);
});

// Rotas públicas
app.get('/cadastrar-artigo', ensureAuthenticated, (req, res) => {
    res.render('cadastrar-artigo', {
        pastaAtual: __dirname,
        usuarioLogado: req.session.login
    });
});

app.get('/perfil', ensureAuthenticated, async (req, res) => {
    const posts = await Posts.find({ autor: req.session.login.username });
    const formattedPosts = formatPosts(posts);

    res.render('perfil', {
        usuarioLogado: req.session.login,
        pastaAtual: __dirname,
        posts: formattedPosts
    });
});

app.get('/', async (req, res) => {
    try {
        let posts = await Posts.find().sort({ titulo: -1 });

        if (req.query.busca == null) {
            const formattedPosts = formatPosts(posts);
            return res.render('index', {
                pastaAtual: __dirname,
                posts: formattedPosts,
                usuarioLogado: req.session.login
            });
        }

        posts = await Posts.find({ titulo: { $regex: req.query.busca, $options: 'i' } });

        return res.render('busca', {
            pastaAtual: __dirname,
            posts,
            usuarioLogado: req.session.login
        });
    } catch (error) {
        console.log(`erro ao carregar a página: ${error}`);
    }
});

app.get('/:slug', async (req, res) => {
    const post = await Posts.findOneAndUpdate(
        { slug: req.params.slug },
        { $inc: { views: 1 } },
        { new: true }
    );

    if (post) {
        const postsVariados = await Posts.find({});
        return res.render('single', {
            pastaAtual: __dirname,
            post,
            posts: postsVariados,
            usuarioLogado: req.session.login,
            desenvolvimento: post.desenvolvimento
        });
    }

    return res.redirect('/');
});

app.get('/usuario/login', (req, res) => {
    if (req.session.login == null) {
        return res.render('login.ejs', {
            pastaAtual: __dirname,
            usuarioLogado: req.session.login
        });
    }

    return res.redirect('/');
});

app.get('/usuario/registro', (req, res) => {
    res.render('register', {
        pastaAtual: __dirname,
        usuarioLogado: req.session.login
    });
});

// Rotas de autenticação
app.post('/usuario/registro', async (req, res) => {
    let registro = { nome: '', username: '', idade: 0, email: '', password: 0, confirmacao: 0 };
    registro = req.body;

    const usuarios = (await Users.find()).map((valores) => valores);
    const registroLog = tratamento.registroLog(registro, usuarios);

    if (!registroLog.registroValidado) {
        return res.send(registroLog.err);
    }

    console.log('registro aprovado: ', registroLog);

    await Users.create({
        nome: registro.nome,
        username: registro.username,
        idade: registro.idade,
        password: registro.password,
        email: registro.email
    });

    req.session.login = await Users.findOne({ username: registro.username, password: registro.password });
    return res.redirect('/');
});

app.post('/usuario/login', async (req, res) => {
    console.log('conferindo sessões...');

    const senhaInserida = req.body.password;
    const usernameInserido = req.body.username;

    const user = await Users.findOne({ username: usernameInserido, password: senhaInserida });

    if (user) {
        req.session.login = user;
        return res.redirect('/');
    }

    return res.send('login ou senha incorretos');
});

// Rotas de posts
app.post('/cadastro-artigo', ensureAuthenticated, async (req, res) => {
    const titulo = req.body.titulo;
    const introducao = req.body.introducao;
    const autor = req.session.login.username;
    const categoria = req.body.categoria;
    const desenvolvimentos = req.body.desenvolvimento;
    const fonte = req.body.fonte;
    const descricao_curta = introducao.substring(0, 50);
    const imagem = req.body.capa //capa

    let slug = buildSlug(titulo);
    const postExistente = await Posts.findOne({ slug });

    if (postExistente) {
        slug = new Tratamento().createNewSlug(postExistente, slug);
    }

    await Posts.create({
        titulo,
        introducao,
        desenvolvimentos,
        autor,
        categoria,
        slug,
        descricao_curta,
        imagem
    });

    return res.redirect('/' + slug);
});

// Rotas de admin
app.get('/admin/painel', ensureAuthenticated, ensureAdmin, async (req, res) => {
    const posts = (await Posts.find().sort({ dataPub: 1 })).map((valores) => {
        valores.descricao_curta = valores.introducao.substring(0, 100);
        return valores;
    });
    const users = await Users.find({});

    res.render('painel-administrativo', {
        pastaAtual: __dirname,
        usuarioLogado: req.session.login,
        posts,
        users
    });
});

app.delete('/banir/:user', ensureAuthenticated, ensureAdmin, async (req, res) => {
    await Users.deleteOne({ username: req.params.user });
    return res.send('Usuario banido!');
});

app.get('/:slug/logout', (req, res) => {
    if (req.session.login && req.params.slug === req.session.login.username) {
        req.session.login = null;
    }
    return res.redirect('/usuario/login');
});

app.delete('/:slug/apagar', ensureAuthenticated, async (req, res) => {
    const postURI = req.params.slug;
    const post = await Posts.findOne({ slug: postURI });

    if (!post) {
        return res.status(404).send('Post não encontrado.');
    }

    const isAdminUser = req.session.login.acesso === 'admin';
    const isPostAuthor = req.session.login.username === post.autor;

    if (!isAdminUser && !isPostAuthor) {
        return res.status(403).send('<h1 style="color:red">Acesso negado</h1>');
    }

    await Posts.findOneAndDelete({ slug: postURI });
    return res.send('post apagado!');
});

app.get('/:user/posts', ensureAuthenticated, ensureAdmin, async (req, res) => {
    const autor = req.params.user;
    const posts = (await Posts.find({ autor })).map((valores) => valores);

    res.render('gerenciar-posts', {
        posts,
        autor,
        pastaAtual: __dirname,
        usuarioLogado: req.session.login
    });
});

