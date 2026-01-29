import type { AnyDataValue } from "@nvisy/core";

export class ExecutionContext {
	private _current: AnyDataValue[] = [];
	private _itemsProcessed = 0;

	get current(): AnyDataValue[] {
		return this._current;
	}

	get itemsProcessed(): number {
		return this._itemsProcessed;
	}

	setCurrent(data: AnyDataValue[]): void {
		this._current = data;
	}

	takeCurrent(): AnyDataValue[] {
		const d = this._current;
		this._current = [];
		return d;
	}

	markProcessed(): void {
		this._itemsProcessed++;
	}

	clear(): void {
		this._current = [];
	}
}
