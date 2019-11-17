import * as Conf from 'conf'

export class AppStore {
	static init(cmdConfig: any): AppStore {
		if (!AppStore.instance) {
			const config = new Conf({ defaults: { dataDir: cmdConfig.dataDir } })

			AppStore.instance = new AppStore(config)
		}

		return AppStore.instance
	}

	public static get config() {
		return AppStore.instance.config
	}

	private static instance: AppStore

	private constructor(public config: Conf) {}
}
