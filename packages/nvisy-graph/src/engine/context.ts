import type { AnyData } from "@nvisy/core";

export class ExecutionContext {
	private _current: AnyData[] = [];
	private _itemsProcessed = 0;

	get current(): AnyData[] {
		return this._current;
	}

	get itemsProcessed(): number {
		return this._itemsProcessed;
	}

	setCurrent(data: AnyData[]): void {
		this._current = data;
	}

	takeCurrent(): AnyData[] {
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
