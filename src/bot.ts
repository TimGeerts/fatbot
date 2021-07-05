import * as Path from 'path';
import { Discord } from '@typeit/discord';

@Discord('?', {
  import: [Path.join(__dirname, 'modules', '*.ts')],
})
abstract class SinBot {}
