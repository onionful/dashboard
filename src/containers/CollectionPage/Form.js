import { Button, Col, Divider, Form, Icon, Input, Popconfirm, Row, Table } from 'antd';
import { FieldTypeIcon, Lock } from 'components';
import { withPermissions, withTranslate } from 'helpers';
import slugify from 'slugify';
import { Component, compose, styled, PropTypes, React } from 'utils/create';

const FieldName = styled.strong({
  display: 'block',
});

class CollectionPageForm extends Component {
  state = {
    lockedId: true,
  };

  setIdValue = name => {
    const { form } = this.props;

    setTimeout(
      () => form.setFieldsValue({ id: slugify(form.getFieldValue(name), { lower: true }) }),
      0,
    );
  };

  handleItemDelete = item => {
    console.log('item', item);
  };

  handleItemEdit = item => {
    console.log('item', item);
  };

  handleLockIdClick = () => {
    const { lockedId } = this.state;
    this.setState({ lockedId: !lockedId });
  };

  handleNameChange = () => {
    const { lockedId } = this.state;

    if (lockedId) {
      this.setIdValue('name');
    }
  };

  handleIdChange = () => {
    this.setIdValue('id');
  };

  handleSubmit = e => {
    e.preventDefault();

    const { onSubmit, form } = this.props;

    form.validateFields((err, values) => {
      if (!err) {
        onSubmit(values);
      }
    });
  };

  render() {
    const { lockedId } = this.state;
    const { _, children, id, item, form } = this.props;

    if (id && item.isEmpty()) {
      throw new Error(_('errors.collectionNotFound'));
    }

    const initialValue = item.has('fields') ? item.get('fields').toJS() : [];
    form.getFieldDecorator('fields', { initialValue });

    return (
      <Form layout="vertical" onSubmit={this.handleSubmit}>
        {children}

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
            {_('collection.addField')}
          </Button>
        </Divider>

        <Table
          showHeader={false}
          pagination={false}
          dataSource={form.getFieldValue('fields')}
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
                  <Button icon="edit" onClick={e => this.handleItemEdit(e, index)} />
                  <Popconfirm
                    title={_('global.removeQuestion')}
                    onConfirm={e => this.handleItemDelete(e, index)}
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

CollectionPageForm.propTypes = {
  _: PropTypes.func.isRequired,
  form: PropTypes.form.isRequired,
  onSubmit: PropTypes.func.isRequired,
  item: PropTypes.map.isRequired,
  children: PropTypes.node,
  id: PropTypes.string,
};

CollectionPageForm.defaultProps = {
  children: null,
  id: null,
};

const mapPropsToFields = ({ item = {} }) => ({
  name: Form.createFormField({
    value: item.get('name'),
  }),
  id: Form.createFormField({
    value: item.get('id'),
  }),
  description: Form.createFormField({
    value: item.get('description'),
  }),
});

export default compose(
  withPermissions(),
  withTranslate,
  Form.create({ mapPropsToFields }),
)(CollectionPageForm);
