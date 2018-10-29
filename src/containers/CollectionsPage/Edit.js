import { Button, Col, Divider, Form, Icon, Input, message, Popconfirm, Row } from 'antd';
import { DraggableTable, FieldTypeIcon, Lock, SectionHeader } from 'components';
import { push } from 'connected-react-router';
import { withLoading, withPermissions, withTranslate } from 'helpers';
import { Map } from 'immutable';
import { mapValues, noop } from 'lodash';
import {
  createCollection,
  fetchCollection,
  getCollection,
  updateCollection,
} from 'reducers/collections/actions';
import slugify from 'slugify';
import { Component, compose, connect, PropTypes, React, styled } from 'utils/create';
import FieldModal from './FieldModal';

const FieldName = styled.strong({
  display: 'block',
});

class CollectionsPageEdit extends Component {
  state = {
    lockedId: true,
    fieldIndex: -1,
    fieldsTouched: false,
  };

  constructor(...args) {
    super(...args);

    this.fieldsModal = React.createRef();
  }

  handleCancelClick = () => {
    const { pushState, path } = this.props;

    pushState(path);
  };

  handleFieldDelete = (e, index) => {
    const { form } = this.props;
    const fields = form.getFieldValue('fields');

    fields.splice(index, 1);

    form.setFieldsValue({ fields });
  };

  handleFieldSubmit = field => {
    const { form } = this.props;
    const { fieldIndex } = this.state;
    const fields = form.getFieldValue('fields');

    fields.splice(fieldIndex >= 0 ? fieldIndex : fields.length, 1, field);

    form.setFieldsValue({ fields });
  };

  handleIdChange = () => {
    this.setIdValue('id');
  };

  handleLockIdClick = () => {
    const { lockedId } = this.state;
    this.setState({ lockedId: !lockedId });
  };

  handleModalShow = (field, index = -1) => {
    this.setState({ fieldIndex: index }, () => this.fieldsModal.current.show(field));
  };

  handleNameChange = () => {
    const { lockedId } = this.state;

    if (lockedId) {
      this.setIdValue('name');
    }
  };

  handleSubmit = e => {
    e.preventDefault();

    const { _, form, isNew, item, handleCreateCollection, handleUpdateCollection } = this.props;

    form.validateFields((err, values) => {
      if (!err) {
        const handler = isNew ? handleCreateCollection : handleUpdateCollection(item.get('id'));
        handler(values).then(() => {
          message.success(_(`messages.collections.${isNew ? 'created' : 'updated'}`));
        });
      }
    });
  };

  handleTableSort = fields => {
    const { form } = this.props;
    this.setState({ fieldsTouched: true });
    form.setFieldsValue({ fields });
  };

  setIdValue = name => {
    const { form } = this.props;

    setTimeout(
      () => form.setFieldsValue({ id: slugify(form.getFieldValue(name), { lower: true }) }),
      0,
    );
  };

  render() {
    const { fieldsTouched, lockedId } = this.state;
    const { _, isNew, item, id, form } = this.props;

    if (id && item.isEmpty()) {
      throw new Error(_('errors.collectionNotFound'));
    }

    form.getFieldDecorator('fields');
    const touched = fieldsTouched || form.isFieldsTouched();
    const fields = form.getFieldValue('fields');

    return (
      <Form layout="vertical" onSubmit={this.handleSubmit}>
        <SectionHeader
          title={_(`collections.title.${isNew ? 'create' : 'edit'}`, item)}
          description={_(`collections.description.${isNew ? 'create' : 'edit'}`)}
          action={
            <Button.Group>
              <Button onClick={this.handleCancelClick} icon="rollback">
                {_(`global.${touched ? 'cancel' : 'back'}`)}
              </Button>
              <Button htmlType="submit" type="primary" icon="save" disabled={!touched}>
                {_('global.save')}
              </Button>
            </Button.Group>
          }
        />

        <Row gutter={24}>
          <Col span={12}>
            <Form.Item label={_('global.id')}>
              {form.getFieldDecorator('id', {
                disabled: true,
                rules: [{ required: true, message: _('errors.required') }],
              })(
                <Input
                  type="text"
                  addonAfter={<Lock locked={lockedId} onLock={this.handleLockIdClick} />}
                  disabled={lockedId}
                  onChange={this.handleIdChange}
                />,
              )}
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={_('global.name')}>
              {form.getFieldDecorator('name', {
                rules: [{ required: true, message: _('errors.required') }],
              })(<Input type="text" onChange={this.handleNameChange} />)}
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label={_('global.description')}>
          {form.getFieldDecorator('description')(<Input.TextArea autosize />)}
        </Form.Item>

        <Divider orientation="right">
          <Button onClick={() => this.handleModalShow()}>
            <Icon type="plus" />
            {_('collections.addField')}
          </Button>
        </Divider>

        <FieldModal
          onSubmit={this.handleFieldSubmit}
          form={form}
          fields={fields}
          ref={this.fieldsModal}
        />

        <DraggableTable
          showHeader={false}
          pagination={false}
          dataSource={fields}
          onSort={this.handleTableSort}
          rowKey="id"
          columns={[
            {
              align: 'center',
              dataIndex: 'type',
              width: 80,
              render: type => <FieldTypeIcon type={type} />,
            },
            {
              key: 'name',
              render: field => (
                <div>
                  <FieldName>{field.name}</FieldName>
                  <small>{field.id}</small>
                </div>
              ),
            },
            {
              align: 'center',
              key: 'actions',
              width: 100,
              render: (field, record, index) => (
                <Button.Group>
                  <Button icon="edit" onClick={() => this.handleModalShow(field, index)} />
                  <Popconfirm
                    title={_('global.removeQuestion')}
                    onConfirm={e => this.handleFieldDelete(e, index)}
                  >
                    <Button icon="delete" type="danger" />
                  </Popconfirm>
                </Button.Group>
              ),
            },
          ]}
        />
      </Form>
    );
  }
}

CollectionsPageEdit.propTypes = {
  _: PropTypes.func.isRequired,
  form: PropTypes.form.isRequired,
  path: PropTypes.string.isRequired,
  handleCreateCollection: PropTypes.func,
  handleUpdateCollection: PropTypes.func,
  id: PropTypes.string,
  isNew: PropTypes.bool,
  item: PropTypes.map,
  pushState: PropTypes.func,
};

CollectionsPageEdit.defaultProps = {
  handleCreateCollection: noop,
  handleUpdateCollection: noop,
  pushState: noop,
  isNew: true,
  id: null,
  item: Map(),
};

const mapStateToProps = (
  state,
  {
    match: {
      params: { id },
    },
  },
) => ({
  item: getCollection(state, id),
  isNew: !id,
});

const mapDispatchToProps = dispatch => ({
  pushState: path => dispatch(push(path)),
  handleCreateCollection: data => dispatch(createCollection(data)),
  handleUpdateCollection: id => data => dispatch(updateCollection(id, data)),
});

const mapPropsToFields = ({ item = {} }) =>
  mapValues(item.toJS(), value => Form.createFormField({ value }));

export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withLoading({
    type: 'collections',
    action: ({ id }) => id && fetchCollection(id),
  }),
  withPermissions(),
  withTranslate,
  Form.create({ mapPropsToFields }),
)(CollectionsPageEdit);
