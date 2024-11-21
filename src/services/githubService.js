async function getTasks(userToken, projectId) {
	const response = await axios.get(
		`https://api.github.com/projects/${projectId}/issues`,
		{
			headers: { Authorization: `token ${userToken}` },
		}
	)
	return response.data
}
async function getComments(userToken, issueId) {
	const response = await axios.get(
		`https://api.github.com/issues/${issueId}/comments`,
		{
			headers: { Authorization: `token ${userToken}` },
		}
	)
	return response.data
}
