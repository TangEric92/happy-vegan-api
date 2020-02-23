const express = require("express");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
const _ = require("lodash");

const router = express.Router();
const UserModel = require("../models/User"); // Require en dernier car il est fait par nous, et on a moins confiance en nous qu'aux autres

// Importation de Cloudinary
var cloudinary = require("cloudinary");
// Configuration de Cloudinary
cloudinary.config({
  cloud_name: "lereacteur",
  api_key: 249285873623283,
  api_secret: "3uAw-nmX8WpLtp-hWLyOdWeHpqo"
});

router.post("/sign_up", async (req, res) => {
  const password = req.body.password;
  const username = req.body.username;
  const biography = req.body.biography;
  const email = req.body.email;

  const token = uid2(16); // On genere une chaine de caractere de taille 16
  const salt = uid2(16); // On genere une chaine de caractere de taille 16

  const hash = SHA256(password + salt).toString(encBase64); // On melange le password et le salt et on les encrypt

  try {
    const user = new UserModel({
      account: {
        username: username,
        biography: biography
      },
      email: email,
      token: token,
      hash: hash,
      salt: salt
    });

    await user.save(); // On sauvegarde le model prealablement créé
    return res.json(_.pick(user, ["_id", "token", "account"])); // On renvoit une selection de key au client
  } catch (err) {
    return res.status(400).json({ error: err.message }); // Si il y a une erreur, on la renvoit
  }
});

router.post("/log_in", async (req, res) => {
  const password = req.body.password;
  const email = req.body.email;
  const username = req.body.username;

  let filters = {};
  if (email) {
    filters.email = email;
  } else {
    filters["account.username"] = username; // Ici on met le chemin sous format string de la variable qu'on veut comparer
  }

  try {
    const user = await UserModel.findOne(filters);

    const hash = SHA256(password + user.salt).toString(encBase64); // On melange le password et le salt et on les encrypt
    if (user.hash === hash) {
      user.token = uid2(16); // On genere une chaine de caractere de taille 16
      user.lastConnexion = Date.now();

      await user.save();
      return res.json(
        _.pick(user, ["_id", "token", "account", "lastConnexion"])
      ); // On renvoit une selection de key au client
    }
  } catch (err) {
    return res.status(400).json({ error: err.message }); // Si il y a une erreur, on la renvoit
  }
});

const uploadPictures = (req, res, next) => {
  // J'initialise un tableau vide pour y stocker mes images uploadées
  const pictures = [];
  // J'initialise le nombre d'upload à zéro
  let filesUploaded = 0;
  // Et pour chaque fichier dans le tableau, je crée un upload vers Cloudinary
  const files = Object.keys(req.files);
  if (files.length) {
    files.forEach(fileKey => {
      // Je crée un nom spécifique pour le fichier
      const name = uid2(16);
      cloudinary.v2.uploader.upload(
        req.files[fileKey].path,
        {
          // J'assigne un dossier spécifique dans Cloudinary pour chaque utilisateur
          public_id: `leboncoin/${req.user._id}/${name}`
        },
        (error, result) => {
          console.log(error, result);
          // Si j'ai une erreur avec l'upload, je sors de ma route
          if (error) {
            return res.status(500).json({ error });
          }
          // Sinon, je push mon image dans le tableau
          pictures.push(result.secure_url);
          // Et j'incrémente le nombre d'upload
          filesUploaded++;
          console.log("-------\n", result);
          // Si le nombre d'uploads est égal au nombre de fichiers envoyés...
          if (filesUploaded === files.length) {
            /* res
                        .status(200)
                        .json({message: `You've uploaded ${filesUploaded} files.`}); */
            // ... je stocke les images dans l'objet `req`...
            req.pictures = pictures;
            // ... et je poursuis ma route avec `next()`
            next();
          }
        }
      );
    });
  } else {
    // Pas de fichier à uploader ? Je poursuis ma route avec `next()`.
    next();
  }
};

router.put("/edit", async (req, res) => {
  const userId = req.params.id;
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({
      error: {
        message: "No token"
      }
    });
  }

  try {
    const user = await UserModel.findOne({ token: token.split(" ")[1] }); // Split pour enlever le "Bearer "
    // On transforme la date en format timestamps (nbr de milisecond depuis 1970-xx-xx)
    const lastConnexion = Date.parse(user.lastConnexion);
    // On recupere la date de maintenant en timestamps
    const currentDate = Date.now();
    // On regarde si ca n'a pas depassé 10sec (ou 10.000 ms)
    /*
    if (currentDate - lastConnexion > 10000) {
      return res.status(401).json({
        error: {
          message: "Token outdated"
        }
      });
    }
    */
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

      return res.json(_.pick(user, ["_id", "account", "lastConnexion"])); // On renvoit une selection de key au client
    }
    return res.status(401).json({
      error: {
        message: "Invalid token"
      }
    });
  } catch (err) {
    return res.status(400).json({ error: err.message }); // Si il y a une erreur, on la renvoit
  }
});

router.get("/:id", async (req, res) => {
  const userId = req.params.id;
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({
      error: {
        message: "No token"
      }
    });
  }

  try {
    const userSrc = await UserModel.findOne({ token: token.split(" ")[1] }); // Split pour enlever le "Bearer "
    // On transforme la date en format timestamps (nbr de milisecond depuis 1970-xx-xx)
    const lastConnexion = Date.parse(userSrc.lastConnexion);
    // On recupere la date de maintenant en timestamps
    const currentDate = Date.now();
    // On regarde si ca n'a pas depassé 10sec (ou 10.000 ms)
    if (currentDate - lastConnexion > 10000) {
      return res.status(401).json({
        error: {
          message: "Token outdated"
        }
      });
    }
    if (userSrc) {
      const user = await UserModel.findById(userId);
      return res.json(_.pick(user, ["_id", "account", "lastConnexion"])); // On renvoit une selection de key au client
    }
    return res.status(401).json({
      error: {
        message: "Invalid token"
      }
    });
  } catch (err) {
    return res.status(400).json({ error: err.message }); // Si il y a une erreur, on la renvoit
  }
});

module.exports = router;
