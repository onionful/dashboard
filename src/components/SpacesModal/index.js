import { List, Modal } from 'antd';
import Logo from 'components/Logo';
import { noop } from 'lodash';
import { Map } from 'immutable';
import { fetchSpaces, setSpace } from 'reducers/spaces/actions';
import { colors } from 'utils';
import { Component, connect, PropTypes, React, styled } from 'utils/create';

const StyledLogo = styled(Logo)({
  display: 'block',
  margin: '0 auto',
  width: '10rem',
});

const Header = styled.h1({
  textAlign: 'center',
  margin: '2rem',
  color: colors.white,
});

const Item = styled(List.Item)({
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  color: colors.white,
  fontSize: '1.2rem',

  '&:hover': {
    background: colors.onion,
    color: colors.black,
  },
});

class SpacesModal extends Component {
  componentDidMount() {
    const { handleFetchSpaces } = this.props;
    handleFetchSpaces().then(() => {
      const { handleSetSpace, spaces } = this.props;
      if (spaces.size === 1) {
        handleSetSpace(spaces.first().get('id'));
      }
    });
  }

  onItemClick = value => {
    const { handleSetSpace } = this.props;
    handleSetSpace(value);
  };

  render() {
    const { isLoading, spaces } = this.props;

    return (
      <Modal
        visible
        closable={false}
        footer={null}
        bodyStyle={{ backgroundColor: colors.background, color: colors.white }}
      >
        <StyledLogo />
        <Header>Select your current space</Header>
        <List
          bordered
          loading={isLoading}
          dataSource={spaces.toList()}
          renderItem={item => (
            <Item onClick={() => this.onItemClick(item.get('id'))}>{item.get('name')}</Item>
          )}
        />
      </Modal>
    );
  }
}

SpacesModal.propTypes = {
  handleFetchSpaces: PropTypes.func,
  handleSetSpace: PropTypes.func,
  isLoading: PropTypes.bool,
  spaces: PropTypes.map,
};

SpacesModal.defaultProps = {
  spaces: Map(),
  isLoading: true,
  handleFetchSpaces: noop,
  handleSetSpace: noop,
};

const mapStateToProps = state => ({
  space: state.getIn(['spaces', 'current']),
  spaces: state.getIn(['spaces', 'data']),
  isLoading: state.getIn(['spaces', 'isLoading']),
});

const mapDispatchToProps = dispatch => ({
  handleFetchSpaces: params => dispatch(fetchSpaces(params)),
  handleSetSpace: space => dispatch(setSpace(space)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SpacesModal);
