/**
 * name : services/org-admin.js
 * author : Priyanka Pradeep
 * created-date : 15-Sep-2023
 * Description : Org Admin Service Helper.
 */

// Dependencies

const common = require('@constants/common')
const httpStatusCode = require('@generics/http-status')
const utils = require('@generics/utils')
const _ = require('lodash')
const userQueries = require('@database/queries/users')
const kafkaCommunication = require('@generics/kafka-communication')
const roleQueries = require('@database/queries/userRole')
const fileUploadQueries = require('@database/queries/fileUpload')
const orgRoleReqQueries = require('@database/queries/orgRoleRequest')
const entityTypeQueries = require('@database/queries/entityType')
const organizationQueries = require('@database/queries/organization')
const notificationTemplateQueries = require('@database/queries/notificationTemplate')
const { eventBroadcaster } = require('@helpers/eventBroadcaster')
const { Queue } = require('bullmq')
const { Op } = require('sequelize')
const UserCredentialQueries = require('@database/queries/userCredential')

module.exports = class OrgAdminHelper {
	/**
	 * Bulk create users
	 * @method
	 * @name bulkUserCreate
	 * @param {Array} users - user details.
	 * @param {Object} tokenInformation - token details.
	 * @returns {CSV} - created users.
	 */

	static async bulkUserCreate(filePath, tokenInformation) {
		try {
			const { id, organization_id } = tokenInformation
			const { name, email } = await userQueries.findOne({ id }, { attributes: ['name', 'email'] })

			const organization = await organizationQueries.findOne({ id: organization_id }, { attributes: ['name'] })

			const creationData = {
				name: utils.extractFilename(filePath),
				input_path: filePath,
				type: common.fileTypeCSV,
				organization_id,
				created_by: id,
			}

			const result = await fileUploadQueries.create(creationData)
			if (!result?.id) {
				return common.successResponse({
					responseCode: 'CLIENT_ERROR',
					statusCode: httpStatusCode.bad_request,
					message: 'USER_CSV_UPLOADED_FAILED',
				})
			}

			//push to queue
			const redisConfiguration = utils.generateRedisConfigForQueue()
			const invitesQueue = new Queue(process.env.DEFAULT_QUEUE, redisConfiguration)
			await invitesQueue.add(
				'upload_invites',
				{
					fileDetails: result,
					user: {
						id,
						name,
						email,
						organization_id,
						org_name: organization.name,
					},
				},
				{
					removeOnComplete: true,
					attempts: common.NO_OF_ATTEMPTS,
					backoff: {
						type: 'fixed',
						delay: common.BACK_OFF_RETRY_QUEUE, // Wait 10 min between attempts
					},
				}
			)

			return common.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'USER_CSV_UPLOADED',
				result: result,
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * List of uploaded invitee file
	 * @method
	 * @name getBulkInvitesFilesList
	 * @param {Number} page - page No.
	 * @param {Number} limit - page limit.
	 * @param {String} status - status field.
	 * @returns {JSON} - List of file uploads
	 */
	static async getBulkInvitesFilesList(req) {
		try {
			let listFileUpload = await fileUploadQueries.listUploads(
				req.pageNo,
				req.pageSize,
				req.query.status ? req.query.status : null,
				req.decodedToken.organization_id
			)

			if (listFileUpload.count > 0) {
				await Promise.all(
					listFileUpload.data.map(async (upload) => {
						/* Assigned upload url from the stored location */
						upload.input_path = await utils.getDownloadableUrl(upload.input_path)
						if (upload.output_path) {
							upload.output_path = await utils.getDownloadableUrl(upload.output_path)
						}
						return upload
					})
				)
			}

			return common.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'FILE_UPLOAD_FETCHED',
				result: listFileUpload,
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Get role request details
	 * @method
	 * @name getRequestDetails
	 * @param {Number} id - request id
	 * @returns {JSON} - Details of role request
	 */
	static async getRequestDetails(requestId, organization_id) {
		try {
			let requestDetails = await orgRoleReqQueries.requestDetails(
				{
					id: requestId,
					organization_id,
				},
				{
					attributes: {
						exclude: ['created_at', 'updated_at', 'deleted_at'],
					},
				}
			)

			if (!requestDetails) {
				return common.failureResponse({
					message: 'REQUEST_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			return common.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'ORG_ROLE_REQ_FETCHED',
				result: requestDetails,
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Get list of role change requests
	 * @method
	 * @name getRequests
	 * @param {Object} req - request data
	 * @returns {JSON} - List of role request
	 */
	static async getRequests(params) {
		try {
			let filterQuery = {
				organization_id: params.decodedToken.organization_id,
			}

			if (params.body?.filters) {
				for (const [key, value] of Object.entries(params.body.filters)) {
					filterQuery[key] = value
				}
			}

			const options = {
				attributes: {
					exclude: ['created_at', 'updated_at', 'deleted_at'],
				},
				raw: true,
			}

			let requestList = await orgRoleReqQueries.listAllRequests(
				filterQuery,
				params.pageNo,
				params.pageSize,
				options,
				params.decodedToken.organization_id
			)

			return common.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'ORG_ROLE_REQ_LIST_FETCHED',
				result: requestList,
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Update Request Status
	 * @method
	 * @name updateRequestStatus
	 * @param {Object} req - request data
	 * @returns {JSON} - Response of request status change.
	 */
	static async updateRequestStatus(bodyData, tokenInformation) {
		try {
			const requestId = bodyData.request_id
			delete bodyData.request_id

			bodyData.handled_by = tokenInformation.id
			const rowsAffected = await orgRoleReqQueries.update(
				{ id: requestId, organization_id: tokenInformation.organization_id },
				bodyData
			)
			if (rowsAffected === 0) {
				return common.failureResponse({
					message: 'ORG_ROLE_REQ_FAILED',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			const requestDetails = await orgRoleReqQueries.requestDetails({ id: requestId })

			const isApproved = bodyData.status === common.ACCEPTED_STATUS
			const isRejected = bodyData.status === common.REJECTED_STATUS

			const shouldSendEmail = isApproved || isRejected
			const message = isApproved ? 'ORG_ROLE_REQ_APPROVED' : 'ORG_ROLE_REQ_UPDATED'

			const user = await userQueries.findByPk(requestDetails.requester_id)
			console.log(shouldSendEmail, 'shouldSendEmail')
			if (isApproved) {
				await updateRoleForApprovedRequest(requestDetails, user)
			}

			console.log(shouldSendEmail, 'shouldSendEmail')
			if (shouldSendEmail) {
				await sendRoleRequestStatusEmail(user, bodyData.status)
			}

			return common.successResponse({
				statusCode: httpStatusCode.ok,
				message,
				result: requestDetails,
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * Deactivate User
	 * @method
	 * @name deactivateUser
	 * @param {Number} id - user id
	 * @param {Object} loggedInUserId - logged in user id
	 * @returns {JSON} - Deactivated user data
	 */
	static async deactivateUser(bodyData, tokenInformation) {
		try {
			let filterQuery = {
				organization_id: tokenInformation.organization_id,
			}

			for (let item in bodyData) {
				filterQuery[item] = {
					[Op.in]: bodyData[item],
				}
			}
			let userIds = []

			if (bodyData.email) {
				const userCredentials = await UserCredentialQueries.findAll(
					{ email: { [Op.in]: bodyData.email } },
					{
						attributes: ['user_id'],
					}
				)
				userIds = _.map(userCredentials, 'user_id')
				delete filterQuery.email
				filterQuery.id = userIds
			} else {
				userIds = bodyData.id
			}
			let [rowsAffected] = await userQueries.updateUser(filterQuery, {
				status: common.INACTIVE_STATUS,
				updated_by: tokenInformation.id,
			})

			if (rowsAffected == 0) {
				return common.failureResponse({
					message: 'STATUS_UPDATE_FAILED',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			//check and deactivate upcoming sessions
			eventBroadcaster('deactivateUpcomingSession', {
				requestBody: {
					user_ids: userIds,
				},
			})

			return common.successResponse({
				statusCode: httpStatusCode.ok,
				message: 'USER_DEACTIVATED',
			})
		} catch (error) {
			throw error
		}
	}

	/**
	 * @description 					- Inherit new entity type from an existing default org's entityType.
	 * @method
	 * @name 							- inheritEntityType
	 * @param {String} entityValue 		- Entity type value
	 * @param {String} entityLabel 		- Entity type label
	 * @param {Integer} userOrgId 		- User org id
	 * @param {Integer} userId 			- Userid
	 * @returns {Promise<Object>} 		- A Promise that resolves to a response object.
	 */

	static async inheritEntityType(entityValue, entityLabel, userOrgId, userId) {
		try {
			let defaultOrgId = await organizationQueries.findOne(
				{ code: process.env.DEFAULT_ORGANISATION_CODE },
				{ attributes: ['id'] }
			)
			defaultOrgId = defaultOrgId.id
			if (defaultOrgId === userOrgId) {
				return common.failureResponse({
					message: 'USER_IS_FROM_DEFAULT_ORG',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}
			// Fetch entity type data using defaultOrgId and entityValue
			const filter = {
				value: entityValue,
				organization_id: defaultOrgId,
				allow_filtering: true,
			}

			let entityTypeDetails = await entityTypeQueries.findOneEntityType(filter)

			// If no matching data found return failure response
			if (!entityTypeDetails) {
				return common.failureResponse({
					message: 'ENTITY_TYPE_NOT_FOUND',
					statusCode: httpStatusCode.bad_request,
					responseCode: 'CLIENT_ERROR',
				})
			}

			// Build data for inheriting entityType
			entityTypeDetails.parent_id = entityTypeDetails.organization_id
			entityTypeDetails.label = entityLabel
			entityTypeDetails.organization_id = userOrgId
			entityTypeDetails.created_by = userId
			entityTypeDetails.updated_by = userId
			delete entityTypeDetails.id

			// Create new inherited entity type
			let inheritedEntityType = await entityTypeQueries.createEntityType(entityTypeDetails)
			return common.successResponse({
				statusCode: httpStatusCode.created,
				message: 'ENTITY_TYPE_CREATED_SUCCESSFULLY',
				result: inheritedEntityType,
			})
		} catch (error) {
			console.log(error)
			throw error
		}
	}
}

function updateRoleForApprovedRequest(requestDetails, user) {
	return new Promise(async (resolve, reject) => {
		try {
			const userRoles = await roleQueries.findAll(
				{ id: user.roles, status: common.ACTIVE_STATUS },
				{ attributes: ['title', 'id', 'user_type', 'status'] }
			)

			const systemRoleIds = userRoles
				.filter((role) => role.user_type === common.ROLE_TYPE_SYSTEM)
				.map((role) => role.id)

			let rolesToUpdate = [...systemRoleIds]

			const newRole = await roleQueries.findOne(
				{ id: requestDetails.role, status: common.ACTIVE_STATUS },
				{ attributes: ['title', 'id', 'user_type', 'status'] }
			)

			eventBroadcaster('roleChange', {
				requestBody: {
					user_id: requestDetails.requester_id,
					new_roles: [newRole.title],
					current_roles: _.map(userRoles, 'title'),
				},
			})

			rolesToUpdate.push(requestDetails.role)
			const roles = _.uniq(rolesToUpdate)

			await userQueries.updateUser(
				{ id: requestDetails.requester_id },
				{
					roles,
				}
			)

			//delete from cache
			const redisUserKey = common.redisUserPrefix + requestDetails.requester_id.toString()
			await utils.redisDel(redisUserKey)

			return resolve({
				success: true,
			})
		} catch (error) {
			return error
		}
	})
}

async function sendRoleRequestStatusEmail(userDetails, status) {
	try {
		let templateData
		if (status === common.ACCEPTED_STATUS) {
			templateData = await notificationTemplateQueries.findOneEmailTemplate(
				process.env.MENTOR_REQUEST_ACCEPTED_EMAIL_TEMPLATE_CODE,
				userDetails.organization_id
			)
		} else if (status === common.REJECTED_STATUS) {
			templateData = await notificationTemplateQueries.findOneEmailTemplate(
				process.env.MENTOR_REQUEST_REJECTED_EMAIL_TEMPLATE_CODE,
				userDetails.organization_id
			)
		}
		console.log(templateData, 'templateData')
		if (templateData) {
			const organization = await organizationQueries.findOne(
				{ id: userDetails.organization_id },
				{ attributes: ['name'] }
			)

			const payload = {
				type: common.notificationEmailType,
				email: {
					to: userDetails.email,
					subject: templateData.subject,
					body: utils.composeEmailBody(templateData.body, {
						name: userDetails.name,
						appName: process.env.APP_NAME,
						orgName: organization.name,
						portalURL: process.env.PORTAL_URL,
					}),
				},
			}
			console.log(
				{ name: userDetails.name, appName: process.env.APP_NAME, orgName: organization.name },
				'payload'
			)
			await kafkaCommunication.pushEmailToKafka(payload)
		}

		return { success: true }
	} catch (error) {
		return error
	}
}
