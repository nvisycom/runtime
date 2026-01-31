import { describe, it, expect } from "vitest";
import {
	sqlModule,
	postgres,
	mysql,
	mssql,
} from "../src/index.js";
import {
	SqlCredentials,
	SqlParams,
} from "../src/shared/schemas.js";

describe("sqlModule", () => {
	it("has id 'sql'", () => {
		expect(sqlModule.id).toBe("sql");
	});

	it("exposes postgres, mysql, mssql providers", () => {
		expect(sqlModule.providers).toHaveProperty("postgres");
		expect(sqlModule.providers).toHaveProperty("mysql");
		expect(sqlModule.providers).toHaveProperty("mssql");
	});

	it("has no actions", () => {
		expect(Object.keys(sqlModule.actions)).toHaveLength(0);
	});
});

describe("provider factories", () => {
	it("postgres exposes credential and param schemas", () => {
		expect(postgres.credentialSchema).toBe(SqlCredentials);
		expect(postgres.paramSchema).toBe(SqlParams);
	});

	it("mysql exposes credential and param schemas", () => {
		expect(mysql.credentialSchema).toBe(SqlCredentials);
		expect(mysql.paramSchema).toBe(SqlParams);
	});

	it("mssql exposes credential and param schemas", () => {
		expect(mssql.credentialSchema).toBe(SqlCredentials);
		expect(mssql.paramSchema).toBe(SqlParams);
	});
});
