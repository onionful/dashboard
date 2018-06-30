import { React, PropTypes } from 'utils/create';
import { intlShape } from 'react-intl';
import Markdown from 'react-markdown';

const FormattedMarkdown = ({ id, defaultMessage, values }, { intl: { formatMessage } }) => (
  <Markdown source={formatMessage({ id, defaultMessage }, values)} />
);

FormattedMarkdown.contextTypes = {
  intl: intlShape,
};

FormattedMarkdown.propTypes = {
  id: PropTypes.string.isRequired,
  values: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  defaultMessage: PropTypes.string,
};

FormattedMarkdown.defaultProps = {
  values: {},
  defaultMessage: '',
};

export default FormattedMarkdown;