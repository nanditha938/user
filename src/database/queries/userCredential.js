'use strict'
const UserCredential = require('@database/models/index').UserCredential

exports.create = async (data) => {
	try {
		const res = await UserCredential.create(data)
		return res.get({ plain: true })
	} catch (error) {
		console.log(error)
		throw error
	}
}

exports.findOne = async (filter, options = {}) => {
	try {
		return await UserCredential.findOne({
			where: filter,
			...options,
			raw: true,
		})
	} catch (error) {
		console.log(error)
		throw error
	}
}

exports.updateUser = async (filter, update, options = {}) => {
	try {
		return await UserCredential.update(update, {
			where: filter,
			...options,
			individualHooks: true,
		})
	} catch (error) {
		console.log(error)
		throw error
	}
}

exports.forceDeleteUserWithEmail = async (email) => {
	try {
		return await UserCredential.destroy({
			where: {
				email,
			},
			force: true, // Setting force to true for a hard delete
		})
	} catch (error) {
		throw error
	}
}

exports.findAll = async (filter, options = {}) => {
	try {
		return await UserCredential.findAll({
			where: filter,
			...options,
			raw: true,
		})
	} catch (error) {
		console.log(error)
		throw error
	}
}
