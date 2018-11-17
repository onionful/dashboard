import { Select, Spin } from 'antd';
import { UserLabel } from 'components';
import { fromJS, List } from 'immutable';
import { debounce, noop } from 'lodash';
import { fetchLabels, findUsers } from 'reducers/users/actions';
import { Component, connect, PropTypes, React } from 'utils/create';

class UsersSelect extends Component {
  constructor(...args) {
    super(...args);

    this.lastFetchId = 0;
    this.handleSearch = debounce(this.handleSearch, 500);
  }

  state = {
    data: [],
    fetching: false,
  };

  handleChange = values => {
    const { onChange } = this.props;

    onChange(fromJS(values.map(({ key }) => key)));

    this.setState({
      data: [],
      fetching: false,
    });
  };

  handleSearch = value => {
    if (value.trim().length < 3) {
      return;
    }

    this.lastFetchId += 1;
    const fetchId = this.lastFetchId;
    this.setState({ data: [], fetching: true });

    findUsers(value).then(({ data: { users } }) => {
      if (fetchId !== this.lastFetchId) {
        return;
      }

      const { handleFetchLabels } = this.props;
      handleFetchLabels(users.map(user => user.user_id)).then(() =>
        this.setState({
          fetching: false,
          data: users.map(user => ({ ...user, id: user.user_id })),
        }),
      );
    });
  };

  render() {
    const { value } = this.props;
    const { fetching, data } = this.state;

    return (
      <Select
        labelInValue
        filterOption={false}
        mode="multiple"
        notFoundContent={fetching ? <Spin size="small" /> : null}
        placeholder="Select users"
        value={value.toArray().map(id => ({ key: id, label: <UserLabel id={id} /> }))}
        onChange={this.handleChange}
        onSearch={this.handleSearch}
      >
        {data.map(({ id }) => (
          <Select.Option key={id}>
            <UserLabel id={id} />
          </Select.Option>
        ))}
      </Select>
    );
  }
}

UsersSelect.propTypes = {
  handleFetchLabels: PropTypes.func,
  onChange: PropTypes.func,
  value: PropTypes.list,
};

UsersSelect.defaultProps = {
  handleFetchLabels: noop,
  onChange: noop,
  value: List(),
};

const mapDispatchToProps = {
  handleFetchLabels: fetchLabels,
};

export default connect(
  null,
  mapDispatchToProps,
)(UsersSelect);
