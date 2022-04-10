import React, { FC, useEffect, useState } from 'react';
import { Checkbox, Modal } from 'antd';
import { useIntl } from 'react-intl';
import cls from 'classnames';
import { useEngines } from '../../hooks';
import './index.css';
import { isWindows } from '../../utils';

export type A6yScreenSelectorPurpose = 'screenShare' | 'rdc';

export interface A6yScreenSelectorProps {
  title?: string;
  purpose?: A6yScreenSelectorPurpose;
  visible: boolean;
  onOk: (displayId: any, withAudio: boolean) => Promise<void>;
  onCancel: () => Promise<void>;
}

export const A6yScreenSelector: FC<A6yScreenSelectorProps> = ({
  title,
  purpose = 'screenShare',
  visible,
  onOk,
  onCancel,
}) => {
  const intl = useIntl();
  const { rtcEngine, rdcEngine } = useEngines();
  const [displayId, setDisplayId] = useState<any>();
  const [withAudio, setWithAudio] = useState(false);
  const [displays, setDisplays] = useState<any[]>([]);
  // const [windows, setWindows] = useState<any[]>([]);

  useEffect(() => {
    if (rtcEngine && purpose === 'screenShare') {
      const displays = rtcEngine
        .getFSSDisplays()
        .map((display) => ({
          ...display,
          thumbnail: URL.createObjectURL(new Blob([display.image])),
        }))
        .map(({ thumbnail, height, width, displayId }) => ({
          thumbnail: thumbnail,
          id: displayId,
          height,
          width,
        }));
      console.log('displays', displays);
      setDisplays(displays);
      // const windows = rtcEngine.getFSSWindows();
      // setWindows(windows);
      // console.log('windows', windows);
    }
    if (rdcEngine && purpose === 'rdc') {
      rdcEngine.getDisplays().then((displays) => {
        console.log('displays', displays);
        setDisplays(displays);
      });
    }
  }, [purpose, visible, rtcEngine, rdcEngine]);

  const handleOk = async () => {
    await onOk(displayId, withAudio);
  };
  return (
    <Modal
      wrapClassName="a6y-screen-selector"
      title={
        title ??
        intl.formatMessage({ id: `a6y.screen.selector.${purpose}.title` })
      }
      okText={intl.formatMessage({ id: `a6y.screen.selector.${purpose}.ok` })}
      visible={visible}
      onOk={handleOk}
      okButtonProps={{ disabled: !displayId }}
      width={616}
      onCancel={onCancel}>
      {isWindows() && purpose === 'screenShare' ? (
        <div className="a6y-with-audio">
          <Checkbox
            checked={withAudio}
            onChange={() => setWithAudio(!withAudio)}>
            {intl.formatMessage({ id: 'a6y.screen.selector.withAudio' })}
          </Checkbox>
        </div>
      ) : null}
      <div className="a6y-displays">
        {displays.map((display, index) => (
          <div
            key={display.id}
            className={cls({
              'a6y-display': 1,
              checked: displayId && display.id === displayId.id,
            })}
            onClick={() => {
              if (purpose === 'screenShare') {
                setDisplayId(display.id);
              }
              if (purpose === 'rdc') {
                setDisplayId(display);
              }
            }}>
            <div className="a6y-display-thumbnail">
              <img src={display.thumbnail} alt="display" />
            </div>
            <div className="a6y-display-name">
              {intl.formatMessage({
                id: 'a6y.screen.selector.display',
              })}
              &nbsp;
              {index + 1}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};
