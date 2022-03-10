var mongoose = require('mongoose');
var Schema = mongoose.Schema;


mongoose.Promise = global.Promise;

mongoose.connect(process.env.DB, { useNewUrlParser: true });
mongoose.set('useCreateIndex', true);

// user schema
var MovieSchema = new Schema({
    title: {type: String, required: true, index: { unique: true }},
    released: {type: Number, required: true},
    genre: {type: String, required: true},
    actors: [{ name: String, charName: String, required: true}],
    // actor1: {type: String, required: true},
    // actor2: {type: String, required: true},
    // actor3: {type: String, required: true}
});

// return the model to our server
module.exports = mongoose.model('Movie', MovieSchema);