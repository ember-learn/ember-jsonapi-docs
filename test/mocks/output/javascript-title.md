```js {data-filename=app/routes/articles.js}
import Route from '@ember/routing/route';
export default class ArticlesRoute extends Route {
  resetController(controller, isExiting, transition) {
    if (isExiting && transition.targetName !== 'error') {
      controller.set('page', 1);
    }
  }
}
```
