```handlebars {data-filename=app/components/person-profile.hbs}
  <h1>{{person.title}}</h1>
  {{! Executed in the component's context. }}
  {{yield}} {{! block contents }}
  ```
  If you want to customize the component, in order to
  handle events or actions, you implement a subclass
  of `Ember.Component` named after the name of the
  component.
  For example, you could implement the action
  `hello` for the `person-profile` component:
  ```js {data-filename=app/components/person-profile.js}
  import Ember from 'ember';
  export default Ember.Component.extend({
    actions: {
      hello(name) {
        console.log("Hello", name);
      }
    }
  });
```
