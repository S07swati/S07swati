const Joi = require("joi");

module.exports.reviewSchema = Joi.object({
   review: Joi.object({
    review: Joi.number().require().min(1).max(5),
    comment: Joi.string().require(),

   }).required(),
});