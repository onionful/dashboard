import { Avatar, Icon, Layout, Menu, Tooltip } from 'antd';
import { ClickParam } from 'antd/es/menu';
import { Logo, SpacesModal } from 'components';
import {
  CollectionsPage,
  ContentPage,
  ErrorPage,
  HomePage,
  NotFoundPage,
  SpacesPage,
  UsersPage,
} from 'containers';
import {
  IWithErrorHandler,
  IWithTranslate,
  withAuthCheck,
  withErrorHandler,
  withLoading,
  withTranslate,
} from 'hocs';
import { useAuth } from 'hooks';
import { noop } from 'lodash';
import React, { ComponentClass, FunctionComponent, useState } from 'react';
import { Link, Route, RouteComponentProps, Switch, withRouter } from 'react-router-dom';
import { ApplicationState } from 'reducers';
import { fetchProfile, getProfile, logout } from 'reducers/auth';
import { getCollections } from 'reducers/collections';
import { fetchSpaces, getCurrentSpace, setSpace } from 'reducers/spaces';
import { Collection, Profile, Space } from 'types';
import { acronym, colors, media, Permission } from 'utils';
import { compose, connect, push, styled } from 'utils/create';

const Container = styled(Layout.Content)`
  position: relative;
  height: 100%;
  padding: 20px;
`;

const Content = styled.div`
  background: #fff;
  padding: 24px;
`;

const StyledLogo = styled(Logo)`
  display: block;
  margin: 2rem auto;
  width: 50%;
`;

const UserInfo = styled.div`
  cursor: pointer;
  background-color: ${colors.background};
  padding: 1rem 0;
  text-align: center;
  transition: box-shadow 0.5s;

  &:hover {
    box-shadow: inset 0 0 100px 100px rgba(255, 255, 255, 0.1);
  }

  div {
    color: ${colors.white};
    padding-top: 1rem;
    opacity: 0.65;
  }
`;

const SpaceInfo = styled.div`
  cursor: pointer;
  background-color: ${colors.background};
  border-top: 1px solid ${colors.black};
  color: ${colors.white};
  font-weight: bold;
  margin-bottom: 1rem;
  padding: 1rem;
  text-align: center;
  transition: box-shadow 0.5s, color 0.5s;

  &:hover {
    box-shadow: inset 0 0 100px 100px rgba(255, 255, 255, 0.1);
    color: ${colors.onion};
  },
`;

interface MenuItem {
  key: string;
  icon: string;
  name?: string;
  permission?: string;
  disabled?: boolean;
  component?: ComponentClass;
  render?: (props: any) => JSX.Element;
}

interface MenuItemGroup {
  key: string;
  items: MenuItem[];
}

interface OwnProps {}

interface StateProps {
  profile?: Profile;
  space?: Space;
  collections: { [key: string]: Collection };
}

interface DispatchProps {
  handleSetSpace: (spaceId: string) => void;
  handlePush: (path: string) => void;
}

interface RouteProps {}

type Props = OwnProps &
  StateProps &
  DispatchProps &
  RouteComponentProps<RouteProps> &
  IWithErrorHandler &
  IWithTranslate;

const App: FunctionComponent<Props> = ({
  _,
  error,
  errorInfo,
  handlePush,
  handleSetSpace,
  profile,
  space,
  collections,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [spacesModalVisible, setSpacesModalVisible] = useState(false);
  const { logout } = useAuth();

  const handleMenuClick = ({ key }: ClickParam) => {
    switch (key) {
      case 'logout':
        logout();
        return handlePush('/login');
      default:
        return handlePush(`/${key}`);
    }
  };
  const handleErrorDismiss = () => {};

  // const hasPermissions = ({ permission }) => hasPermission(permission) || true;
  const profileName = profile ? profile.name || profile.nickname : '';

  const menuItems: MenuItemGroup[] = [
    {
      key: 'collection',
      items: Object.values(collections)
        .map<MenuItem>(collection => ({
          key: `collection/${collection.id}`,
          icon: 'file',
          name: collection.name,
          render: props => <ContentPage {...props} collection={collection} />,
        }))
        .concat({
          key: 'collections',
          icon: 'file-add',
          component: CollectionsPage,
          permission: Permission.USERS_LIST,
          disabled: !!space,
        }),
    },
    {
      key: 'system',
      items: [
        { key: 'spaces', icon: 'rocket', component: SpacesPage },
        {
          key: 'users',
          icon: 'user',
          component: UsersPage,
          permission: Permission.USERS_LIST,
        },
        { key: 'settings', icon: 'setting' },
        { key: 'logout', icon: 'logout' },
      ],
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', maxWidth: media.xl }}>
      <Layout.Sider collapsible breakpoint="lg" collapsed={collapsed} onCollapse={setCollapsed}>
        <Link to="/">
          <StyledLogo />
        </Link>

        {profile && (
          <Link to="/profile">
            <Tooltip
              placement="right"
              title={profileName}
              trigger={collapsed ? 'hover' : undefined}
            >
              <UserInfo>
                <Avatar size="large" src={profile.picture} />
                {!collapsed && <div>{profileName}</div>}
              </UserInfo>
            </Tooltip>
          </Link>
        )}

        {space && (
          <Tooltip placement="right" title={space.name} trigger={collapsed ? 'hover' : undefined}>
            <SpaceInfo onClick={() => setSpacesModalVisible(true)}>
              {collapsed ? acronym(space.name) : space.name}
            </SpaceInfo>
          </Tooltip>
        )}

        <Menu defaultSelectedKeys={['4']} mode="inline" theme="dark" onClick={handleMenuClick}>
          {menuItems.map(group => (
            <Menu.ItemGroup key={group.key} title={_(`menu.${group.key}`)}>
              {/*{group.items.filter(hasPermissions)}*/}
              {group.items.map(item => (
                <Menu.Item key={item.key} disabled={item.disabled}>
                  <Icon type={item.icon} />
                  <span>{item.name || _(`menu.${item.key}`) || ''}</span>
                </Menu.Item>
              ))}
            </Menu.ItemGroup>
          ))}
        </Menu>
      </Layout.Sider>

      <SpacesModal
        visible={spacesModalVisible}
        onCreate={() => {
          setSpacesModalVisible(false);
          handlePush('/spaces/create');
        }}
        onSetSpace={(spaceId: string) => {
          setSpacesModalVisible(false);
          handleSetSpace(spaceId);
        }}
      />

      {(!spacesModalVisible || error) && (
        <Layout>
          <Container>
            {error ? (
              <ErrorPage error={error} errorInfo={errorInfo} onDismiss={handleErrorDismiss} />
            ) : (
              <Content>
                <Switch>
                  <Route exact component={HomePage} path="/" />
                  {menuItems.map(section =>
                    section.items.map(({ key, render, component }) => (
                      <Route component={component} path={`/${key}`} render={render} />
                    )),
                  )}
                  <Route component={NotFoundPage} />
                </Switch>
              </Content>
            )}
          </Container>
          <Layout.Footer style={{ textAlign: 'center' }}>
            {_('global.copyrights') || ''}
          </Layout.Footer>
        </Layout>
      )}
    </Layout>
  );
};

App.defaultProps = {
  _: noop,
  collections: {},
  handlePush: noop,
};

const mapStateToProps = (state: ApplicationState) => {
  console.log('state', state);
  return {
    profile: getProfile(state),
    space: getCurrentSpace(state) as Space,
    collections: getCollections(state),
  };
};

const mapDispatchToProps = {
  handlePush: push,
  handleSetSpace: setSpace,
};

export default compose<FunctionComponent<Props>>(
  connect<StateProps, DispatchProps, OwnProps, ApplicationState>(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withAuthCheck,
  withErrorHandler,
  withLoading({
    type: ['app', 'profileGet'],
    action: [fetchProfile, fetchSpaces],
  }),
  withRouter,
  withTranslate,
)(App);
