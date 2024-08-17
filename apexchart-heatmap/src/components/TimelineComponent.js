import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import moment from 'moment';
import Modal from 'react-modal';
import {
  Box, Typography, Select, MenuItem, FormControl, InputLabel, Button
} from '@mui/material';

const EventListContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  overflow-x: auto;
  padding: 20px;
`;

const EventItem = styled(Box)`
  display: flex;
  align-items: center;
  margin: 3px 0;
  width: 100%;
`;

const EventCircle = styled(Box)`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: ${({ eventType, eventTypeColors }) => eventTypeColors[eventType] || '#BD5090'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  flex-shrink: 0; /* 크기를 고정하여 찌그러지지 않도록 설정 */
`;

const EventTextContainer = styled(Box)`
  display: flex;
  align-items: center;
  margin-left: 20px;
  flex-grow: 1;
  min-width: 0; /* 자식 요소들이 flex-grow를 잘 적용받도록 설정 */
`;

const EventText = styled(Typography)`
  padding: 5px;
  flex-grow: 1; /* 텍스트가 공간을 적절히 차지하도록 설정 */
`;

const OriginalEventContainer = styled(Box)`
  margin-left: 20px;
  max-width: 400px; /* 적절한 max-width 값을 설정 */
  word-wrap: break-word;
  word-break: break-all;
  flex-shrink: 1; /* 너무 좁아질 때는 줄어들 수 있도록 설정 */
`;

const OriginalEventText = styled(Typography)`
  color: #888;
  font-size: 0.8em;
`;

const EventTimestamp = styled(Typography)`
  margin-right: 20px;
  padding: 5px;
  color: #888;
  flex-shrink: 0; /* 시간 텍스트도 고정된 크기를 유지 */
`;

const ModalContent = styled(Box)`
  background: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 400px;
  margin: auto;
`;

const customStyles = {
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
  },
};

Modal.setAppElement('#root');

const TimelineComponent = ({ events, eventTypeColors, availableDates, selectedDate, onDateChange }) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filteredEvents, setFilteredEvents] = useState([]);

  useEffect(() => {
    if (events && selectedDate) {
      const filtered = events
        .filter(event => moment(event.Timestamp).format('YYYY-MM-DD') === selectedDate)
        .sort((a, b) => moment(a.Timestamp) - moment(b.Timestamp));
      setFilteredEvents(filtered);
    }
  }, [events, selectedDate]);

  const openModal = (event) => {
    setSelectedEvent(event);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedEvent(null);
  };

  return (
    <EventListContainer>
      <FormControl variant="outlined" margin="normal">
        <InputLabel>Select Date</InputLabel>
        <Select
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          label="Select Date"
        >
          {availableDates.map(date => (
            <MenuItem key={date} value={date}>{date}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {filteredEvents.length === 0 ? (
        <Typography variant="body1">No events for this date.</Typography>
      ) : (
        filteredEvents.map((event, index) => (
          <EventItem key={index}>
            <EventTimestamp>{moment(event.Timestamp).format('HH:mm:ss')}</EventTimestamp>
            <EventCircle
              eventType={event.Data_Type}
              eventTypeColors={eventTypeColors}
              onClick={() => openModal(event)}
              aria-label={`Event at ${moment(event.Timestamp).format('HH:mm:ss')} - ${event.Data_Type_User_behavior}`}
            />
            <EventTextContainer>
              <EventText>{event.Data_Type_User_behavior}</EventText>
            </EventTextContainer>
            <OriginalEventContainer>
              <OriginalEventText>{event.Original_eventMessage}</OriginalEventText>
            </OriginalEventContainer>
          </EventItem>
        ))
      )}

      {selectedEvent && (
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          contentLabel="Event Details"
          style={customStyles}
        >
          <ModalContent>
            <Typography variant="h6">Event Details</Typography>
            <Typography><strong>User_behavior:</strong> {selectedEvent.Data_Type_User_behavior}</Typography>
            <Typography><strong>Timestamp:</strong> {moment(selectedEvent.Timestamp).format('YYYY-MM-DD HH:mm:ss')}</Typography>
            <Typography><strong>Process:</strong> {selectedEvent.Process}</Typography>
            <Typography><strong>Subsystem:</strong> {selectedEvent.Subsystem}</Typography>
            <Typography><strong>Original Event Message:</strong> {selectedEvent.Original_eventMessage}</Typography>
            <Button onClick={closeModal}>Close</Button>
          </ModalContent>
        </Modal>
      )}
    </EventListContainer>
  );
};

export default TimelineComponent;
