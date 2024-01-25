/**
 * name : constants/common.js
 * author : Aman Kumar Gupta
 * Date : 04-Nov-2021
 * Description : All commonly used constants through out the service
 */

const form = require('@generics/form')
const { elevateLog, correlationId } = require('elevate-logger')
const logger = elevateLog.init()
const successResponse = async ({
	statusCode = 500,
	responseCode = 'OK',
	message,
	result = [],
	meta = {},
	isResponseAStream = false,
	stream,
	fileName = '',
}) => {
	const versions = await form.getAllFormsVersion()
	let response = {
		statusCode,
		responseCode,
		message,
		result,
		isResponseAStream,
		meta: {
			...meta,
			formsVersion: versions,
			correlation: correlationId.getId(),
			meetingPlatform: process.env.DEFAULT_MEETING_SERVICE,
		},
	}
	if (isResponseAStream) {
		response.stream = stream
		response.fileName = fileName
	}

	logger.info('Request Response', { response: response })

	return response
}

const failureResponse = ({ message = 'Oops! Something Went Wrong.', statusCode = 500, responseCode, result }) => {
	const errorMessage = message.key || message

	const error = new Error(errorMessage)
	error.statusCode = statusCode
	error.responseCode = responseCode
	error.interpolation = message?.interpolation || false
	error.data = result || []

	return error
}

function getPaginationOffset(page, limit) {
	return (page - 1) * limit
}

module.exports = {
	pagination: {
		DEFAULT_PAGE_NO: 1,
		DEFAULT_PAGE_SIZE: 100,
	},
	successResponse,
	failureResponse,
	getPaginationOffset,
	// guestUrls: [
	// 	'/sessions/completed',
	// 	'/sessions/updateRecordingUrl',
	// 	'/sessions/details',
	// 	'/mentors/profile/',
	// 	'/mentors/upcomingSessions/',
	// 	'/platform/config',
	// ],
	// apiPermissionsUrls: [
	// 	'/mentoring/v1/permissions/create',
	// 	'/mentoring/v1/mentees/list',
	// 	'/mentoring/v1/sessions/addMentees',
	// 	'/mentoring/v1/sessions/removeMentees',
	// 	'/mentoring/v1/sessions/enrolledMentees/:id',
	// 	'/mentoring/v1/manage-sessions/downloadSessions',
	// 	'/mentoring/v1/manage-sessions/createdSessions',
	// 	'/mentoring/v1/permissions/list',
	// 	'/mentoring/v1/permissions/update/:id',
	// 	'/mentoring/v1/permissions/delete/:id',
	// 	'/mentoring/v1/modules/create',
	// 	'/mentoring/v1/modules/update/:id',
	// 	'/mentoring/v1/modules/list',
	// 	'/mentoring/v1/modules/delete/:id',
	// 	'/mentoring/v1/rolePermissionMapping/create/:role_id',
	// 	'/mentoring/v1/rolePermissionMapping/delete/:role_id',
	// 	'/mentoring/v1/profile/filterList?entity_types={entity_types}',
	// 	'/mentoring/v1/cloud-services/getSignedUrl',
	// 	'/mentoring/v1/sessions/update',
	// 	'/mentoring/v1/sessions/update/:id',
	// 	'/mentoring/v1/entity/create',
	// 	'/mentoring/v1/entity/read',
	// 	'/mentoring/v1/entity/read/:id',
	// 	'/mentoring/v1/entity/update',
	// 	'/mentoring/v1/entity/update/:id',
	// 	'/mentoring/v1/entity/delete',
	// 	'/mentoring/v1/entity/delete/:id',
	// 	'/mentoring/v1/form/create',
	// 	'/mentoring/v1/form/read',
	// 	'/mentoring/v1/form/read/:id',
	// 	'/mentoring/v1/form/update',
	// 	'/mentoring/v1/form/update/:id',
	// 	'/mentoring/v1/entity-type/create',
	// 	'/mentoring/v1/entity-type/read',
	// 	'/mentoring/v1/entity-type/update',
	// 	'/mentoring/v1/entity-type/update/:id',
	// 	'/mentoring/v1/entity-type/delete',
	// 	'/mentoring/v1/entity-type/delete/:id',
	// 	'/mentoring/v1/sessions/list',
	// 	'/mentoring/v1/sessions/details',
	// 	'/mentoring/v1/sessions/details/:id',
	// 	'/mentoring/v1/sessions/share',
	// 	'/mentoring/v1/sessions/share/:id',
	// 	'/mentoring/v1/sessions/enroll',
	// 	'/mentoring/v1/sessions/enroll/:id',
	// 	'/mentoring/v1/sessions/unEnroll',
	// 	'/mentoring/v1/sessions/unEnroll/:id',
	// 	'/mentoring/v1/sessions/start',
	// 	'/mentoring/v1/sessions/start/:id',
	// 	'/mentoring/v1/sessions/feedback',
	// 	'/mentoring/v1/sessions/feedback/:id',
	// 	'/mentoring/v1/sessions/updateRecordingUrl',
	// 	'/mentoring/v1/sessions/updateRecordingUrl/:id',
	// 	'/mentoring/v1/sessions/completed',
	// 	'/mentoring/v1/sessions/completed/:id',
	// 	'/mentoring/v1/sessions/getRecording',
	// 	'/mentoring/v1/sessions/getRecording/:id',
	// 	'/mentoring/v1/mentees/sessions',
	// 	'/mentoring/v1/mentees/joinSession',
	// 	'/mentoring/v1/mentees/joinSession/:id',
	// 	'/mentoring/v1/mentees/homeFeed',
	// 	'/mentoring/v1/mentees/reports',
	// 	'/mentoring/v1/mentees/profile',
	// 	'/mentoring/v1/mentees/create',
	// 	'/mentoring/v1/mentees/update',
	// 	'/mentoring/v1/mentees/getMenteeExtension/',
	// 	'/mentoring/v1/mentees/deleteMenteeExtension',
	// 	'/mentoring/v1/mentors/reports',
	// 	'/mentoring/v1/mentors/profile',
	// 	'/mentoring/v1/mentors/profile/:id',
	// 	'/mentoring/v1/mentors/upcomingSessions',
	// 	'/mentoring/v1/mentors/upcomingSessions/:id',
	// 	'/mentoring/v1/mentors/share',
	// 	'/mentoring/v1/mentors/share/:id',
	// 	'/mentoring/v1/mentors/create',
	// 	'/mentoring/v1/mentors/update',
	// 	'/mentoring/v1/mentors/getMentorExtension',
	// 	'/mentoring/v1/mentors/deleteMentorExtension',
	// 	'/mentoring/v1/feedback/submit',
	// 	'/mentoring/v1/feedback/submit/:id',
	// 	'/mentoring/v1/feedback/forms',
	// 	'/mentoring/v1/feedback/forms/:id',
	// 	'/mentoring/v1/questions/create',
	// 	'/mentoring/v1/questions/update',
	// 	'/mentoring/v1/questions/update/:id',
	// 	'/mentoring/v1/questions/read',
	// 	'/mentoring/v1/questions/read/:id',
	// 	'/mentoring/v1/questionsSet/create',
	// 	'/mentoring/v1/questionsSet/update',
	// 	'/mentoring/v1/questionsSet/update/:id',
	// 	'/mentoring/v1/questionsSet/read',
	// 	'/mentoring/v1/questionsSet/read/:id',
	// 	'/mentoring/v1/users/pendingFeedbacks',
	// 	'/mentoring/v1/users/list',
	// 	'/mentoring/v1/issues/create',
	// 	'/mentoring/v1/platform/config',
	// 	'/mentoring/v1/admin/userDelete',
	// 	'/mentoring/v1/org-admin/inheritEntityType',
	// 	'/mentoring/v1/org-admin/roleChange',
	// 	'/mentoring/v1/org-admin/setOrgPolicies',
	// 	'/mentoring/v1/org-admin/getOrgPolicies',
	// 	'/mentoring/v1/org-admin/deactivateUpcomingSession',
	// 	'/mentoring/v1/organization/update',
	// 	'/mentoring/v1/admin/triggerPeriodicViewRefresh',
	// 	'/mentoring/v1/admin/triggerViewRebuild',
	// 	'/mentoring/v1/admin/triggerPeriodicViewRefreshInternal',
	// 	'/mentoring/v1/admin/triggerViewRebuildInternal',
	// 	'/mentoring/v1/mentors/list',
	// 	'/mentoring/v1/mentors/createdSessions',
	// 	'/mentoring/v1/mentors/details',
	// 	'/mentoring/v1/mentors/details/:id',
	// 	'/scheduler/jobs/create',
	// 	'/scheduler/jobs/updateDelay',
	// 	'/scheduler/jobs/remove',
	// 	'/scheduler/jobs/list',
	// 	'/scheduler/jobs/purge',
	// 	'/mentoring/v1/profile/create',
	// 	'/mentoring/v1/profile/read',
	// 	'/mentoring/v1/profile/update',
	// 	'/mentoring/v1/notification/template',
	// 	'/mentoring/v1/notification/template/:id',
	// 	'/mentoring/v1/org-admin/updateRelatedOrgs',
	// 	'/mentoring/v1/sessions/enrolledMentees',
	// ],
	DELETE_METHOD: 'DELETE',
	dateFormat: 'dddd, Do MMMM YYYY',
	timeFormat: 'hh:mm A',
	MENTEE_SESSION_REMAINDER_EMAIL_CODE: 'mentee_session_reminder',
	MENTOR_SESSION_REMAINDER_EMAIL_CODE: 'mentor_session_reminder',
	MENTOR_SESSION_ONE_HOUR_REMAINDER_EMAIL_CODE: 'mentor_one_hour_before_session_reminder',
	UTC_DATE_TIME_FORMAT: 'YYYY-MM-DDTHH:mm:ss',
	internalAccessUrs: [
		'/notifications/emailCronJob',
		'/org-admin/roleChange',
		'/org-admin/updateOrganization',
		'/org-admin/deactivateUpcomingSession',
		'/admin/triggerPeriodicViewRefreshInternal',
		'/admin/triggerViewRebuildInternal',
		'/org-admin/updateRelatedOrgs',
		'/sessions/completed',
		'/sessions/bulkUpdateMentorNames',
	],
	COMPLETED_STATUS: 'COMPLETED',
	UNFULFILLED_STATUS: 'UNFULFILLED',
	PUBLISHED_STATUS: 'PUBLISHED',
	LIVE_STATUS: 'LIVE',
	MENTOR_EVALUATING: 'mentor',
	internalCacheExpirationTime: process.env.INTERNAL_CACHE_EXP_TIME, // In Seconds
	RedisCacheExpiryTime: process.env.REDIS_CACHE_EXP_TIME,
	BBB_VALUE: 'BBB', // BigBlueButton code
	BBB_PLATFORM: 'BigBlueButton (Default)',
	REPORT_EMAIL_SUBJECT: 'Having issue in logging in/signing up',
	ADMIN_ROLE: 'admin',
	roleValidationPaths: [
		'/sessions/enroll/',
		'/sessions/unEnroll/',
		'/sessions/update',
		'/feedback/submit/',
		'/sessions/start/',
		'/mentors/share/',
		'/mentees/joinSession/',
		'/mentors/upcomingSessions/',
		'/issues/create',
	],
	MENTOR_ROLE: 'mentor',
	MENTEE_ROLE: 'mentee',
	USER_ROLE: 'user',
	PUBLIC_ROLE: 'public',
	SESSION_MANAGER_ROLE: 'session_manager',
	MANAGE_SESSION_CODE: 'manage_session',
	MEDIUM: 'medium',
	RECOMMENDED_FOR: 'recommended_for',
	CATEGORIES: 'categories',
	jobsToCreate: [
		{
			jobId: 'mentoring_session_one_hour_',
			jobName: 'notificationBeforeAnHour',
			emailTemplate: 'mentor_one_hour_before_session_reminder',
		},
		{
			jobId: 'mentoring_session_one_day_',
			jobName: 'notificationBeforeOneDay',
			emailTemplate: 'mentor_session_reminder',
		},
		{
			jobId: 'mentoring_session_fifteen_min_',
			jobName: 'notificationBeforeFifteenMin',
			emailTemplate: 'mentee_session_reminder',
		},
		{
			jobId: 'job_to_mark_session_as_completed_',
			jobName: 'job_to_mark_session_as_completed_',
		},
	],
	notificationJobIdPrefixes: [
		'mentoring_session_one_hour_',
		'mentoring_session_one_day_',
		'mentoring_session_fifteen_min_',
	],
	jobPrefixToMarkSessionAsCompleted: 'job_to_mark_session_as_completed_',
	ORG_ADMIN_ROLE: 'org_admin',

	// Default organization policies
	DEFAULT_ORGANISATION_POLICY: {
		session_visibility_policy: 'CURRENT',
		mentor_visibility_policy: 'CURRENT',
		external_session_visibility_policy: 'CURRENT',
		external_mentor_visibility_policy: 'CURRENT',
		allow_mentor_override: false,
		approval_required_for: [],
	},
	CURRENT: 'CURRENT',
	ALL: 'ALL',
	ASSOCIATED: 'ASSOCIATED',
	PATCH_METHOD: 'PATCH',
	GET_METHOD: 'GET',
	POST_METHOD: 'POST',
	excludedQueryParams: ['enrolled'],
	materializedViewsPrefix: 'm_',
	mentorExtensionModelName: 'MentorExtension',
	sessionModelName: 'Session',
	notificationEndPoint: '/mentoring/v1/notifications/emailCronJob',
	sessionCompleteEndpoint: '/mentoring/v1/sessions/completed/',
	INACTIVE_STATUS: 'INACTIVE',
	ACTIVE_STATUS: 'ACTIVE',
	SEARCH: '',
	INVITED: 'INVITED',
	ENROLLED: 'ENROLLED',
	UNIT_OF_TIME: 'minutes',
	SESSION_TYPE: {
		PUBLIC: 'PUBLIC',
		PRIVATE: 'PRIVATE',
	},
}
