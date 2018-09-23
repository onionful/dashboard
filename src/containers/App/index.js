import { Avatar, Icon, Layout, Menu, Select, Spin, Tooltip } from 'antd';
import { Logo, SpacesModal } from 'components';
import { push } from 'connected-react-router';
import {
  ContentPage,
  ContentTypesPage,
  ErrorPage,
  HomePage,
  NotFoundPage,
  SpacesPage,
  UsersPage,
} from 'containers';
import { withTranslate } from 'helpers';
import { List, Map } from 'immutable';
import { noop } from 'lodash';
import { Redirect, Route, Switch, withRouter } from 'react-router-dom';
import { getProfile } from 'reducers/auth';
import { fetchProfile, logout } from 'reducers/auth/actions';
import { getContentTypes } from 'reducers/contentTypes/actions';
import { getCurrentSpace, getSpaces, setSpace } from 'reducers/spaces/actions';
import { colors, permissions } from 'utils';
import { compose, connect, glamorous, PropTypes, React } from 'utils/create';

const { Sider, Footer } = Layout;

const Container = glamorous(Layout.Content)({
  position: 'relative',
  height: '100%',
  padding: '20px',
});

const Content = glamorous.div({
  background: '#fff',
  padding: 24,
});

const StyledLogo = glamorous(Logo)(({ collapsed }) => ({
  margin: !collapsed ? '3rem' : '1rem',
}));

const UserInfo = glamorous.div({
  cursor: 'pointer',
  backgroundColor: colors.background,
  padding: '1rem 0',
  marginBottom: '1rem',
  textAlign: 'center',

  '& div': {
    color: colors.white,
    paddingTop: '1rem',
    opacity: 0.65,
  },
});

const SpaceSelect = glamorous(Select)({
  width: '100%',
  padding: '1rem',
});

class App extends React.Component {
  state = {
    collapsed: false,
    error: null,
    errorInfo: null,
  };

  // eslint-disable-next-line react/sort-comp
  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
  }

  componentDidMount() {
    this.fetchData();
  }

  componentDidUpdate(prevProps) {
    const { isAuthenticated } = this.props;

    if (isAuthenticated !== prevProps.isAuthenticated) {
      this.fetchData();
    }
  }

  onCollapse = collapsed => {
    this.setState({ collapsed });
  };

  onProfileClick = () => {
    const { pushState } = this.props;
    pushState('/profile');
  };

  onMenuClick = ({ key }) => {
    const { pushState, handleLogout } = this.props;

    switch (key) {
      case 'logout':
        return handleLogout();
      default:
        return pushState(`/${key}`);
    }
  };

  onSpaceChange = space => {
    const { handleSetSpace } = this.props;

    handleSetSpace(space);
  };

  fetchData = () => {
    const { isAuthenticated, handleGetProfile } = this.props;

    if (isAuthenticated) {
      handleGetProfile().catch(error =>
        this.setState({
          error,
          errorInfo: { componentStack: JSON.stringify((error.response || {}).data, null, 2) },
        }),
      );
    }
  };

  render() {
    const {
      _,
      hasPermission,
      isAuthenticated,
      isProfileLoading,
      profile,
      space,
      spaces,
      contentTypes,
    } = this.props;
    const { collapsed, error, errorInfo } = this.state;

    if (!isAuthenticated) {
      return <Redirect to="/login" />;
    }

    const hasPermissions = ({ permission }) => hasPermission(permission) || true;
    const profileName = profile ? profile.get('name') || profile.get('nickname') : '';

    const menuItems = [
      {
        key: 'content',
        items: [
          ...contentTypes.toJS().map(contentType => ({
            name: contentType.name,
            key: `content/${contentType.id}`,
            icon: 'file',
            render: props => <ContentPage {...props} contentType={contentType} />,
          })),
          {
            key: 'content-types',
            icon: 'file-add',
            component: ContentTypesPage,
            permission: permissions.USERS_LIST,
          },
        ],
      },
      {
        key: 'system',
        items: [
          { key: 'spaces', icon: 'book', component: SpacesPage },
          {
            key: 'users',
            icon: 'user',
            component: UsersPage,
            permission: permissions.USERS_LIST,
          },
          { key: 'settings', icon: 'setting' },
          { key: 'logout', icon: 'logout' },
        ],
      },
    ];

    return (
      <Spin spinning={isProfileLoading}>
        <Layout style={{ minHeight: '100vh' }}>
          <Sider breakpoint="lg" collapsible collapsed={collapsed} onCollapse={this.onCollapse}>
            <StyledLogo collapsed={collapsed} />

            {profile && (
              <Tooltip placement="right" trigger={collapsed ? 'hover' : ''} title={profileName}>
                <UserInfo onClick={this.onProfileClick}>
                  <Avatar size="large" src={profile.get('picture')} />
                  {!collapsed && <div>{profileName}</div>}
                </UserInfo>
              </Tooltip>
            )}

            <Spin spinning={spaces.isEmpty()}>
              <SpaceSelect
                showSearch
                placeholder="Select space"
                optionFilterProp="children"
                onChange={this.onSpaceChange}
                value={space}
                filterOption={(input, option) =>
                  option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {spaces.map(item => (
                  <Select.Option key={item.get('id')} value={item.get('id')}>
                    {item.get('name')}
                  </Select.Option>
                ))}
              </SpaceSelect>

              <Menu
                theme="dark"
                mode="inline"
                defaultSelectedKeys={['4']}
                onClick={this.onMenuClick}
              >
                {menuItems.map(group => (
                  <Menu.ItemGroup key={group.key} title={_(`menu.${group.key}`)}>
                    {group.items.filter(hasPermissions).map(item => (
                      <Menu.Item key={item.key}>
                        <Icon type={item.icon} />
                        <span>{item.name || _(`menu.${item.key}`)}</span>
                      </Menu.Item>
                    ))}
                  </Menu.ItemGroup>
                ))}
              </Menu>
            </Spin>
          </Sider>

          {!isProfileLoading && !space && !error && <SpacesModal />}

          {!isProfileLoading &&
            (space || error) && (
              <Layout>
                <Container>
                  {error ? (
                    <ErrorPage error={error} errorInfo={errorInfo} />
                  ) : (
                    <Content>
                      <Switch>
                        <Route exact path="/" component={HomePage} />
                        {menuItems.map(section =>
                          section.items
                            .filter(({ component }) => component)
                            .map(({ key, render, component }) => (
                              <Route path={`/${key}`} render={render} component={component} />
                            )),
                        )}
                        <Route component={NotFoundPage} />
                      </Switch>
                    </Content>
                  )}
                </Container>
                <Footer style={{ textAlign: 'center' }}>{_('global.copyrights')}</Footer>
              </Layout>
            )}
        </Layout>
      </Spin>
    );
  }
}

App.propTypes = {
  _: PropTypes.func.isRequired,
  hasPermission: PropTypes.func,
  isAuthenticated: PropTypes.bool,
  isProfileLoading: PropTypes.bool,
  profile: PropTypes.map,
  space: PropTypes.string,
  spaces: PropTypes.list,
  contentTypes: PropTypes.list,
  handleGetProfile: PropTypes.func,
  handleLogout: PropTypes.func,
  handleSetSpace: PropTypes.func,
  pushState: PropTypes.func,
};

App.defaultProps = {
  hasPermission: noop,
  isAuthenticated: false,
  isProfileLoading: true,
  profile: Map(),
  space: null,
  spaces: List(),
  contentTypes: List(),
  handleGetProfile: noop,
  handleLogout: noop,
  handleSetSpace: noop,
  pushState: noop,
};

const mapStateToProps = state => ({
  isAuthenticated: state.getIn(['auth', 'isAuthenticated']),
  isProfileLoading: state.getIn(['auth', 'isLoading']),
  profile: getProfile(state),
  space: getCurrentSpace(state),
  spaces: getSpaces(state),
  contentTypes: getContentTypes(state),
});

const mapDispatchToProps = dispatch => ({
  handleGetProfile: () => dispatch(fetchProfile()),
  handleLogout: logout(dispatch),
  handleSetSpace: space => dispatch(setSpace(space)),
  pushState: path => dispatch(push(path)),
});

export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withRouter,
  withTranslate,
)(App);
