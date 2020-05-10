module.exports = async itf => {
	// create table in DB
	const { withDb } = Msa.require('db')
	await withDb(async db => {
		await db.run(
			`CREATE TABLE IF NOT EXISTS msa_params (
				id VARCHAR(255) PRIMARY KEY,
				value TEXT
			)`)
	})
}
