import React from 'react';
import { Form, Select, Input, Button } from 'antd';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { RoleType } from 'assembly-shared';
import { JoinSessionParams } from './interfaces';
import { createProfile, createSession } from '../../services/api';

const Landing = () => {
  const [form] = Form.useForm<JoinSessionParams>();
  const intl = useIntl();
  const navigate = useNavigate();
  const handleFinish = async () => {
    const { channel, username, role } = await form.validateFields();
    const {
      data: { id: sessionId },
    } = await createSession({ channel });
    const {
      data: { id: profileId },
    } = await createProfile(sessionId, { username, role });
    navigate(`/session/${sessionId}/profile/${profileId}`);
  };

  return (
    <Form
      form={form}
      style={{ marginTop: 160 }}
      name="landing"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 8 }}
      onFinish={handleFinish}
    >
      <Form.Item
        label={intl.formatMessage({ id: 'landing.label.channel' })}
        name="channel"
        rules={[
          {
            required: true,
            message: intl.formatMessage({
              id: 'landing.validate.channel.required',
            }),
          },
          {
            min: 6,
            max: 12,
            message: intl.formatMessage({
              id: 'landing.validate.channel.maxAndMin',
            }),
          },
          {
            pattern: /^[a-zA-Z0-9]+$/,
            message: intl.formatMessage({
              id: 'landing.validate.channel.pattern',
            }),
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label={intl.formatMessage({ id: 'landing.label.name' })}
        name="username"
        rules={[
          {
            required: true,
            message: intl.formatMessage({
              id: 'landing.validate.name.required',
            }),
          },
          {
            min: 3,
            message: intl.formatMessage({
              id: 'landing.validate.name.min',
            }),
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label={intl.formatMessage({ id: 'landing.label.role' })}
        name="role"
        rules={[
          {
            required: true,
            message: intl.formatMessage({
              id: 'landing.validate.role.required',
            }),
          },
        ]}
      >
        <Select>
          <Select.Option value={RoleType.HOST}>
            {intl.formatMessage({ id: 'landing.role.options.teacher' })}
          </Select.Option>
          <Select.Option value={RoleType.NORMAL}>
            {intl.formatMessage({ id: 'landing.role.options.student' })}
          </Select.Option>
        </Select>
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 8, span: 8 }}>
        <Button type="primary" htmlType="submit" block>
          {intl.formatMessage({ id: 'landing.button.join' })}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default Landing;
