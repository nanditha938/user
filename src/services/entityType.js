// DependenciesI
const httpStatusCode = require('@generics/http-status')
const common = require('@constants/common')
const entityTypeQueries = require('@database/queries/entityType')
const { UniqueConstraintError } = require('sequelize')
const organizationQueries = require('@database/queries/organization')
const { Op } = require('sequelize')
const { removeDefaultOrgEntityTypes } = require('@generics/utils')
module.exports = class EntityHelper {
	/**
	 * Create entity type.
	 * @method
	 * @name create
	 * @param {Object} bodyData - entity type body data.
	 * @param {String} id -  id.
	 * @returns {JSON} - Created entity type response.
	 */

	static async create(bodyData, id, orgId) {
		bodyData.created_by = id
		bodyData.updated_by = id
		bodyData.organization_id = orgId
		try {
			const entityType = await entityTypeQueries.createEntityType(bodyData)
			return common.successResponse({
				statusCode: httpStatusCode.created,
				message: 'ENTITY_TYPE_CREATED_SUCCESSFULLY',
				result: entityType,
			})
		} catch (error) {
			if (error instanceof UniqueConstraintError) {
				return common.failureResponse({
					message: 'ENTITY_TYPE_ALREADY_EXISTS',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			throw error
		}
	}

	/**
	 * Update entity type.
	 * @method
	 * @name update
	 * @param {Object} bodyData -  body data.
	 * @param {String} id - entity type id.
	 * @param {String} loggedInUserId - logged in user id.
	 * @returns {JSON} - Updated Entity Type.
	 */

	static async update(bodyData, id, loggedInUserId, orgId) {
		;(bodyData.updated_by = loggedInUserId), (bodyData.organization_id = orgId)
		try {
			const [updateCount, updatedEntityType] = await entityTypeQueries.updateOneEntityType(id, bodyData, {
				returning: true,
				raw: true,
			})

			if (updateCount === '0') {
				return common.failureResponse({
					message: 'ENTITY_TYPE_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			return common.successResponse({
				statusCode: httpStatusCode.accepted,
				message: 'ENTITY_TYPE_UPDATED_SUCCESSFULLY',
				result: updatedEntityType,
			})
		} catch (error) {
			if (error instanceof UniqueConstraintError) {
				return common.failureResponse({
					message: 'ENTITY_TYPE_ALREADY_DELETED',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			throw error
		}
	}

	static async readAllSystemEntityTypes(organization_id) {
		try {
			const attributes = ['value', 'label', 'id']

			const entities = await entityTypeQueries.findAllEntityTypes(organization_id, attributes)

			if (!entities.length) {
				return common.failureResponse({
					message: 'ENTITY_TYPE_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			return common.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'ENTITY_TYPE_FETCHED_SUCCESSFULLY',
				result: entities,
			})
		} catch (error) {
			throw error
		}
	}

	static async readUserEntityTypes(body, userId, orgId) {
		try {
			let defaultOrg = await organizationQueries.findOne(
				{ code: process.env.DEFAULT_ORGANISATION_CODE },
				{ attributes: ['id'] }
			)
			let defaultOrgId = defaultOrg.id
			const filter = {
				value: body.value,
				status: 'ACTIVE',
				organization_id: {
					[Op.in]: [orgId, defaultOrgId],
				},
			}
			const entities = await entityTypeQueries.findUserEntityTypesAndEntities(filter)

			const prunedEntities = removeDefaultOrgEntityTypes(entities, orgId)
			return common.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'ENTITY_TYPE_FETCHED_SUCCESSFULLY',
				result: { entity_types: prunedEntities },
			})
		} catch (error) {
			console.log(error)
			throw error
		}
	}
	/**
	 * Delete entity type.
	 * @method
	 * @name delete
	 * @param {String} id - Delete entity type.
	 * @returns {JSON} - Entity deleted response.
	 */

	static async delete(id) {
		try {
			const deleteCount = await entityTypeQueries.deleteOneEntityType(id)
			if (deleteCount === '0') {
				return common.failureResponse({
					message: 'ENTITY_TYPE_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			return common.successResponse({
				statusCode: httpStatusCode.accepted,
				message: 'ENTITY_TYPE_DELETED_SUCCESSFULLY',
			})
		} catch (error) {
			throw error
		}
	}
}
