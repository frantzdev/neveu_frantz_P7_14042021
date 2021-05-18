const models = require('../models');
const fs = require('fs');

/*----------------verb GET ---------------*/
exports.getAllMessage = async (req, res, next) => { 
  let data = [];
  try {  //récupération de tout les messages sur la base de donnée
    messages = await models.Message.findAll();
  } catch (error) {
    return res.status(400).json({error: 'error request'})
  }  
  // console.log(messages)
         //boucle sur tout les messages
  for (let i = 0; i < messages.length; i++) {
    let user = null;
    try {//recherche d'un ID dans la base de donnée User
      user = await models.User.findOne({
        where: {//recherche de l'ID qui est comparé à l'userId présent dans chaque messages
          id: messages[i].UserId
        }     
      })   
    } catch (error) {
      return res.status(400).json({error: 'error request'})
    }
    data.push({ //push de l'objet formaté dans le tableau data
      title: messages[i].title,
      content: messages[i].content,
      image: messages[i].image,
      firstname: user.firstname,
      lastname: user.lastname,
      isAdmin: user.isAdmin,
      idUser: user.id,
      messageUserId: messages[i].UserId,
      idMessage: messages[i].id,
      createdAt: messages[i].createdAt
    })
  }
  //renvoi du tableau dans la reponse
  // console.log(data)
  return res.status(200).json(data)
};
/*----------------verb GET one ID ---------------*/
exports.getOneMessage = async (req, res, next) => {
  //console.log(req.params.id)
  let oneMessage = null;
  try {
    oneMessage = await models.Message.findOne({
      where: { id: req.params.id }  
    })
    // console.log(oneMessage)
  }  
  catch (error) {
    return res.status(400).json({error: 'error request'})
  }  
  //console.log(oneMessage.id)
  return res.status(200).json(oneMessage)
};

/*----------------verb POST ---------------*/
exports.createMessage = async (req, res, next) => {
  const NewMessage = req.file ?
    {
    UserId: req.body.UserId,
    title: req.body.title,
    content: req.body.content,
    image:`${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body }
  const postMessage = await models.Message.create(NewMessage)
  // console.log(postMessage/*.image*/)
  postMessage.save()
    .then( () => res.status(201).json({ message: "Le nouveau message est publié" }))
    .catch(error => res.status(400).json({ error: "Erreur il n'est pas possible de poster un message" }));
};


/*----------------verb PUT ---------------*/
  exports.updateMessage = async (req, res, next) => {
    // console.log(req.params.id);
    const updateValues = req.file ?
      {
      title: req.body.title,
      content: req.body.content,
      image: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
      } : { title: req.body.title, content: req.body.content }
    //let updateValues = {title: req.body.title, content: req.body.content, image: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`}
    await models.Message.update( updateValues, {where: { id: req.params.id}})
      .then( () => res.status(201).json({ message: "Le message est modifié" }))
      .catch(error => res.status(400).json({ error: "Erreur il n'est pas possible de modifier" }));
  };

/*-------------------verb PUT IMAGE---------------*/
exports.imageMessage = async (req, res, next) => {
  await models.Message.findOne({  //recherche du message
    where: {id: req.params.id}
  })
  .then(message => {              //puis dans ce message 
      const filename = message.image.split('/images/')[1];
      fs.unlink(`images/${filename}`, () => { //suppression de l'image par son nom 
        const updateImage = {
            title: req.body.title,
            content: req.body.content,
            image: null
          }
          console.log(updateImage)
          models.Message.update( updateImage, {where: { id: req.params.id}})
      })
    .then(() => res.status(201).json({ message: 'Supprimer image du message'}))
    .catch(error => res.status(400).json({ error }));
  }) 
  .catch(error => res.status(500).json({ error }));
};  

/*----------------verb DELETE ---------------*/
  exports.deleteMessage = async (req, res, next) => {  
    // console.log(req.params.id)
    await models.Message.findOne({  //recherche du message que l'on souhaite supprimer
      where: {id: req.params.id}
    })
    .then(message => {   //puis dans ce message 
      if(req.file) {   //si il y a un fichier
        const filename = message.image.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => { //suppression de l'image par son nom 
        models.Message.destroy({      //suppression du message dans la base de donnée
        where: {id: req.params.id ? req.params.id : req.query.id}
        })
        .then(() => res.status(200).json({ message: 'Supprimer un message avec une image'}))
        .catch(error => res.status(400).json({ error }));
        });
      }            
      else(!req.file)    //sinon il n'y a pas de fichier
        models.Message.destroy({      //suppression du message dans la base de donnée
        where: {id: req.params.id ? req.params.id : req.query.id}
        })
        .then(() => res.status(200).json({ message: 'Supprimer un message sans image'}))
        .catch(error => res.status(400).json({ error }));    
    })
    .catch(error => res.status(500).json({ error }));
  };  

   
  