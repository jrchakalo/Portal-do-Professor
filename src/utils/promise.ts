export const wait = (ms: number, signal?: AbortSignal): Promise<void> =>
	new Promise((resolve, reject) => {
		const timer = setTimeout(resolve, ms);
		const abortHandler = () => {
			clearTimeout(timer);
			reject(new DOMException('Aborted', 'AbortError'));
		};

		if (signal) {
			if (signal.aborted) {
				abortHandler();
				return;
			}

			signal.addEventListener('abort', abortHandler, { once: true });
		}
	});

export const simulateNetworkDelay = async (
	min = 150,
	max = 450,
	signal?: AbortSignal,
): Promise<void> => {
	const jitter = Math.random() * (max - min) + min;
	await wait(jitter, signal);
};
