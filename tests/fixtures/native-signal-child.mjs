/** Real child process used by the signal lifecycle test. No mocked network/runtime. */
import { qualifyNativeWorker } from '../../scripts/qualify-native-worker.mjs';
const [binary, scratch, evidence] = process.argv.slice(2);
try {
  await qualifyNativeWorker({ binary, scratch, evidence, holdProviderProbe: true });
  process.stdout.write('{"status":"unexpected_pass"}\n');
  process.exitCode = 2;
} catch (error) {
  const canceled = error.code === 'qualification_canceled';
  process.stdout.write(JSON.stringify({ status: canceled ? 'canceled' : 'fail' }) + '\n');
  process.exitCode = canceled ? 1 : 2;
}
