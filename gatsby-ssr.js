const isProduction = process.env.NODE_ENV === 'production';

const scriptType = new Set([
  'module',
  'importmap',
  'text/javascript',
  'application/javascript',
]);

/**
 * @typedef {{
 * getHeadComponents(): any[]
 * replaceHeadComponents(head: any[]): void
 * getPostBodyComponents(): any[]
 * replacePostBodyComponents(postBody: any[]): void
 * }} Api
 *
 * @typedef {{
 * noScript?: boolean
 * noSourcemaps?: boolean
 * removeGeneratorTag?: boolean
 * removeReactHelmetAttrs?: boolean
 * removeHeadDataAttrs?: boolean
 * noInlineStyles?: boolean
 * removeGatsbyAnnouncer?: boolean
 * }} Options
 *
 * @param {Api} api
 * @param {Options} options
 */
exports.onPreRenderHTML = (
  {
    getHeadComponents,
    replaceHeadComponents,
    getPostBodyComponents,
    replacePostBodyComponents,
  },
  {
    noScript = true,
    removeGeneratorTag = true,
    removeReactHelmetAttrs = false, // Deprecated
    removeHeadDataAttrs = true,
    noInlineStyles = false,
  },
) => {
  if (isProduction) {
    let head = getHeadComponents();
    let postBody = getPostBodyComponents();

    if (noScript) {
      head = head.filter((i) => {
        if (i.type === 'link' && 'data-allowed' in i.props) { return true; }
        return i.type !== 'link' || i.props.rel !== 'preload' || !(i.props.as === 'script' || i.props.as === 'fetch')
      });

      postBody = postBody.filter((i) => {
        if (i.type === 'script' && (!i.props.type || scriptType.has(i.props.type))) {
          return false;
        }

        // Gatsby v5
        if (i.props.sliceId === '_gatsby-scripts') {
          return false;
        }

        return true;
      });
    }

    if (removeGeneratorTag) {
      head = head.filter(
        (i) => i.type !== 'meta' || i.props.name !== 'generator',
      );
    }

    if (removeHeadDataAttrs || removeReactHelmetAttrs) {
      const gatsbyHead = 'data-gatsby-head'; // Gatsby v4.19.0
      const reactHelmet = 'data-react-helmet';

      head.forEach((i) => {
        if ('props' in i) {
          if (gatsbyHead in i.props) {
            delete i.props[gatsbyHead];
          }

          if (reactHelmet in i.props) {
            delete i.props[reactHelmet];
          }
        }
      });
    }

    if (noInlineStyles) {
      const key = 'data-href';

      head.forEach((i) => {
        if (i.type === 'style' && key in i.props) {
          i.type = 'link';
          i.props = {
            rel: 'stylesheet',
            href: i.props[key],
          };
        }
      });
    }

    replaceHeadComponents(head);
    replacePostBodyComponents(postBody);
  }
};

/**
 * @param {{ element: Record<string, any> }} api
 * @param {Options} options
 * @returns {Record<string, any> | undefined}
 */
exports.wrapRootElement = (
  {
    element,
  },
  {
    removeGatsbyAnnouncer = false,
  },
) => {
  if (isProduction) {

    if (removeGatsbyAnnouncer && Array.isArray(element.props.children)) {
      element.props.children = element.props.children.filter(
        (i) => i.props.id !== 'gatsby-announcer',
      );
    }

    return element;
  }
};
