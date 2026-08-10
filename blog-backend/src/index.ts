import app from './app';
import { env } from './config/env';

const port = env.PORT;

app.listen(port, () => {
  console.log(`Blog API listening on http://localhost:${port}`);
  console.log(`Admin panel at http://localhost:${port}/admin`);
});
