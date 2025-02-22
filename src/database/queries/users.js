'use strict'
const database = require('@database/models/index')
const Organization = require('@database/models/index').Organization
const { Op, QueryTypes } = require('sequelize')
const Sequelize = require('@database/models/index').sequelize

exports.getColumns = async () => {
	try {
		return await Object.keys(database.User.rawAttributes)
	} catch (error) {
		return error
	}
}
exports.getModelName = async () => {
	try {
		return await database.User.name
	} catch (error) {
		return error
	}
}
exports.create = async (data) => {
	try {
		console.log('REACHED CREATE FUNCTION')
		return await database.User.create(data)
	} catch (error) {
		console.log(error)
		return error
	}
}

exports.findOne = async (filter, options = {}) => {
	try {
		return await database.User.findOne({
			where: filter,
			...options,
			raw: true,
		})
	} catch (error) {
		return error
	}
}

exports.updateUser = async (filter, update, options = {}) => {
	try {
		return await database.User.update(update, {
			where: filter,
			...options,
			individualHooks: true,
		})
	} catch (error) {
		return error
	}
}

exports.findByPk = async (id) => {
	try {
		return await database.User.findByPk(id, { raw: true })
	} catch (error) {
		return error
	}
}

exports.findAll = async (filter, options = {}) => {
	try {
		return await database.User.findAll({
			where: filter,
			...options,
			raw: true,
		})
	} catch (error) {
		return error
	}
}

exports.listUsers = async (roleId, organization_id, page, limit, search) => {
	try {
		const offset = (page - 1) * limit
		const whereClause = {}

		if (search) {
			whereClause.name = { [Op.iLike]: search + '%' }
		}

		if (roleId) {
			whereClause.roles = { [Op.contains]: [roleId] }
		}

		if (organization_id) {
			whereClause.organization_id = organization_id
		}

		const filterQuery = {
			where: whereClause,
			attributes: ['id', 'name', 'about', 'image'],
			offset: parseInt(offset, 10),
			limit: parseInt(limit, 10),
			order: [['name', 'ASC']],
			include: [
				{
					model: Organization,
					required: false,
					where: {
						status: 'ACTIVE',
					},
					attributes: ['id', 'name', 'code'],
					as: 'organization',
				},
			],
			raw: true,
			nest: true,
		}

		const { count, rows: users } = await database.User.findAndCountAll(filterQuery)

		return { count, data: users }
	} catch (error) {
		throw error
	}
}

exports.findAllUserWithOrganization = async (filter, options = {}) => {
	try {
		return await database.User.findAll({
			where: filter,
			...options,
			include: [
				{
					model: Organization,
					required: false,
					where: {
						status: 'ACTIVE',
					},
					attributes: ['id', 'name', 'code'],
					as: 'organization',
				},
			],
			raw: true,
			nest: true,
		})
	} catch (error) {
		return error
	}
}

exports.findUserWithOrganization = async (filter, options = {}) => {
	try {
		return await database.User.findOne({
			where: filter,
			...options,
			include: [
				{
					model: Organization,
					required: false,
					where: {
						status: 'ACTIVE',
					},
					attributes: ['id', 'name', 'code'],
					as: 'organization',
				},
			],
			raw: true,
			nest: true,
		})
	} catch (error) {
		return error
	}
}
exports.listUsersFromView = async (roleId, organization_id, page, limit, search, userIds) => {
	try {
		const offset = (page - 1) * limit

		const filterConditions = []

		if (search) {
			filterConditions.push(`users.name ILIKE :search`)
		}

		if (roleId) {
			filterConditions.push(`users.roles @> ARRAY[:roleId]::integer[]`)
		}

		if (organization_id) {
			filterConditions.push(`users.organization_id = :organization_id`)
		}
		if (userIds) {
			filterConditions.push(`users.id IN (:userIds)`)
		}

		const filterClause = filterConditions.length > 0 ? `WHERE ${filterConditions.join(' AND ')}` : ''

		const filterQuery = `
            SELECT
                users.id,
                users.name,
                users.about,
                users.image,
                jsonb_build_object(
                    'id', organization.id,
                    'name', organization.name,
                    'code', organization.code
                ) AS organization
            FROM
                m_${database.User.tableName} AS users
            LEFT JOIN
                ${Organization.tableName} AS organization
            ON
                users.organization_id = organization.id
                AND organization.status = 'ACTIVE'
            ${filterClause}
            ORDER BY
                users.name ASC
            OFFSET
                :offset
            LIMIT
                :limit;
        `

		const replacements = {
			search: `%${search}%`,
			roleId: roleId,
			organization_id: organization_id,
			offset: parseInt(offset, 10),
			limit: parseInt(limit, 10),
			userIds: userIds,
		}

		const users = await Sequelize.query(filterQuery, {
			type: QueryTypes.SELECT,
			replacements: replacements,
		})

		return { count: users.length, data: users }
	} catch (error) {
		throw error
	}
}

exports.changeOrganization = async (id, currentOrgId, newOrgId, updateBody = {}) => {
	const transaction = await Sequelize.transaction()
	try {
		const existingUserRow = await database.User.findOne({
			where: { id, organization_id: currentOrgId },
			raw: true,
			transaction,
		})

		if (!existingUserRow) throw new Error('User not found')

		await database.User.destroy({
			where: { id, organization_id: currentOrgId },
			force: true,
			transaction,
		})

		const newUserRow = await database.User.create(
			{
				...existingUserRow,
				...updateBody,
				organization_id: newOrgId,
				id,
			},
			{ transaction }
		)

		await transaction.commit()
		return newUserRow
	} catch (error) {
		await transaction.rollback()
		throw error
	}
}
