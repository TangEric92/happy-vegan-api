const express = require('express');
const SHA256 = require('crypto-js/sha256');
const encBase64 = require('crypto-js/enc-base64');
const uid2 = require('uid2');
const _ = require('lodash');

const router = express.Router();
const UserModel = require('../models/User'); // Require en dernier car il est fait par nous, et on a moins confiance en nous qu'aux autres

router.post('/sign_up', async (req, res) => {
	const password = req.body.password;
	const username = req.body.username;
	const biography = req.body.biography;
	const email = req.body.email;

	const tokenConnexion = uid2(16); // On genere une chaine de caractere de taille 16
	const salt = uid2(16); // On genere une chaine de caractere de taille 16

	const hash = SHA256(password + salt).toString(encBase64); // On melange le password et le salt et on les encrypt

	try {
		const user = new UserModel({
			account: {
				username: username,
				biography: biography
			},
			email: email,
			tokenConnexion: tokenConnexion,
			hash: hash,
			salt: salt
		});

		await user.save(); // On sauvegarde le model prealablement créé
		return res.json(_.pick(user, [ '_id', 'tokenConnexion', 'account' ])); // On renvoit une selection de key au client
	} catch (err) {
		return res.status(400).json({ error: err.message }); // Si il y a une erreur, on la renvoit
	}
});

router.post('/log_in', async (req, res) => {
	const password = req.body.password;
	const email = req.body.email;
	const username = req.body.username;

	let filters = {};
	if (email) {
		filters.email = email;
	} else {
		filters['account.username'] = username; // Ici on met le chemin sous format string de la variable qu'on veut comparer
	}

	try {
		const user = await UserModel.findOne(filters);

		const hash = SHA256(password + user.salt).toString(encBase64); // On melange le password et le salt et on les encrypt
		if (user.hash === hash) {
			user.tokenConnexion = uid2(16); // On genere une chaine de caractere de taille 16
			user.lastConnexion = Date.now();

			await user.save();
			return res.json(_.pick(user, [ '_id', 'tokenConnexion', 'account', 'lastConnexion' ])); // On renvoit une selection de key au client
		}
	} catch (err) {
		return res.status(400).json({ error: err.message }); // Si il y a une erreur, on la renvoit
	}
});

router.put('/edit', async (req, res) => {
	const userId = req.params.id;
	const tokenConnexion = req.headers.authorization;
	if (!tokenConnexion) {
		return res.status(401).json({
			error: {
				message: 'No token'
			}
		});
	}

	try {
		const user = await UserModel.findOne({ tokenConnexion: tokenConnexion.split(' ')[1] }); // Split pour enlever le "Bearer "
		// On transforme la date en format timestamps (nbr de milisecond depuis 1970-xx-xx)
		const lastConnexion = Date.parse(user.lastConnexion);
		// On recupere la date de maintenant en timestamps
		const currentDate = Date.now();
		// On regarde si ca n'a pas depassé 10sec (ou 10.000 ms)
		if (currentDate - lastConnexion > 10000) {
			return res.status(401).json({
				error: {
					message: 'Token outdated'
				}
			});
		}

		if (user) {
			const biography = req.body.biography;
			if (biography) {
				user.account.biography = biography;
			}

			const username = req.body.username;
			if (username) {
				user.account.username = username;
			}

			const email = req.body.email;
			if (email) {
				user.email = email;
			}

			return res.json(_.pick(user, [ '_id', 'account', 'lastConnexion' ])); // On renvoit une selection de key au client
		}
		return res.status(401).json({
			error: {
				message: 'Invalid token'
			}
		});
	} catch (err) {
		return res.status(400).json({ error: err.message }); // Si il y a une erreur, on la renvoit
	}
});

router.get('/:id', async (req, res) => {
	const userId = req.params.id;
	const tokenConnexion = req.headers.authorization;
	if (!tokenConnexion) {
		return res.status(401).json({
			error: {
				message: 'No token'
			}
		});
	}

	try {
		const userSrc = await UserModel.findOne({ tokenConnexion: tokenConnexion.split(' ')[1] }); // Split pour enlever le "Bearer "
		// On transforme la date en format timestamps (nbr de milisecond depuis 1970-xx-xx)
		const lastConnexion = Date.parse(userSrc.lastConnexion);
		// On recupere la date de maintenant en timestamps
		const currentDate = Date.now();
		// On regarde si ca n'a pas depassé 10sec (ou 10.000 ms)
		if (currentDate - lastConnexion > 10000) {
			return res.status(401).json({
				error: {
					message: 'Token outdated'
				}
			});
		}
		if (userSrc) {
			const user = await UserModel.findById(userId);
			return res.json(_.pick(user, [ '_id', 'account', 'lastConnexion' ])); // On renvoit une selection de key au client
		}
		return res.status(401).json({
			error: {
				message: 'Invalid token'
			}
		});
	} catch (err) {
		return res.status(400).json({ error: err.message }); // Si il y a une erreur, on la renvoit
	}
});

module.exports = router;
