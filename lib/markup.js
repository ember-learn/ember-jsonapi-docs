export default function (doc) {
  for (const data of doc.data) {
    const { id, attributes } = data;

    try {
      const description = attributes.description;

      if (description) {
        attributes.description = fixFilename(description);
      }

      replaceDescriptionFor(attributes.methods);
      replaceDescriptionFor(attributes.properties);
      replaceDescriptionFor(attributes.events);
    } catch (e) {
      console.log(`Error generating markup for ${id}`);
      console.log(e);
      process.exit(1);
    }
  }

  return doc;
}

function replaceDescriptionFor(items) {
  if (items) {
    items.forEach(item => {
      let itemDescription = item.description;
      if (itemDescription) {
        item.description = fixFilename(itemDescription);
      }
    });
  }
}

export function fixFilename(description) {
  if (description) {
    description = description
      .replaceAll(/```([^\n]+)\.(js|hbs|ts)\n/g, '```$2 {data-filename=$1.$2}\n')
      .replaceAll('```hbs', '```handlebars')
      .replaceAll('```no-highlight', '```');
  }

  return description;
}
