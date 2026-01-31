import { describe, it, expect } from "vitest";
import {
	sqlModule,
	postgres,
	mysql,
	mssql,
	filter,
	project,
	rename,
	coerce,
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

	it("exposes filter, project, rename, coerce actions", () => {
		expect(sqlModule.actions).toHaveProperty("filter");
		expect(sqlModule.actions).toHaveProperty("project");
		expect(sqlModule.actions).toHaveProperty("rename");
		expect(sqlModule.actions).toHaveProperty("coerce");
		expect(Object.keys(sqlModule.actions)).toHaveLength(4);
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

describe("action exports", () => {
	it("filter has id 'filter'", () => {
		expect(filter.id).toBe("filter");
	});

	it("project has id 'project'", () => {
		expect(project.id).toBe("project");
	});

	it("rename has id 'rename'", () => {
		expect(rename.id).toBe("rename");
	});

	it("coerce has id 'coerce'", () => {
		expect(coerce.id).toBe("coerce");
	});
});
