/**
 * name : validators/v1/entity-types.js
 * author : Aman Gupta
 * Date : 04-Nov-2021
 * Description : Validations of user entities controller
 */

module.exports = {
	create: (req) => {
		req.checkBody('value')
			.trim()
			.notEmpty()
			.withMessage('value field is empty')
			.matches(/^[A-Za-z]+$/)
			.withMessage('value is invalid, must not contain spaces')

		req.checkBody('label')
			.trim()
			.notEmpty()
			.withMessage('label field is empty')
			.matches(/^[A-Za-z0-9 ]+$/)
			.withMessage('label is invalid')

		req.checkBody('data_type')
			.trim()
			.notEmpty()
			.withMessage('data_type field is empty')
			.matches(/^[A-Za-z]+$/)
			.withMessage('data_type is invalid, must not contain spaces')

		req.checkBody('allow_filtering').optional().isEmpty().withMessage('allow_filtering is not allowed in create')
	},

	update: (req) => {
		req.checkParams('id').notEmpty().withMessage('id param is empty')

		req.checkBody('value')
			.optional()
			.matches(/^[A-Za-z]+$/)
			.withMessage('value is invalid, must not contain spaces')

		req.checkBody('label')
			.optional()
			.matches(/^[A-Za-z0-9 ]+$/)
			.withMessage('label is invalid')

		req.checkBody('status')
			.optional()
			.matches(/^[A-Z]+$/)
			.withMessage('status is invalid, must be in all caps')

		req.checkBody('data_type')
			.optional()
			.matches(/^[A-Za-z]+$/)
			.withMessage('data_type is invalid, must not contain spaces')

		req.checkBody('allow_filtering').optional().isEmpty().withMessage('allow_filtering is not allowed in create')
	},

	read: (req) => {
		console.log()
		if (req.query.data_type) {
			req.checkQuery('data_type')
				.trim()
				.notEmpty()
				.withMessage('data_type field is empty')
				.matches(/^[A-Za-z]+$/)
				.withMessage('type is invalid, must not contain spaces')

			req.checkQuery('status')
				.optional()
				.trim()
				.matches(/^[A-Z]+$/)
				.withMessage('status is invalid, must be in all caps')
		}
	},

	delete: (req) => {
		req.checkParams('id').notEmpty().withMessage('id param is empty')
	},
}
