import { 
    replaceSpacesWithUnderscores, 
    sanitizeKongName, 
    sanitizeRoutePath, 
    calculateEndTime 
  } from '../../utils/helpers'; // adjust the import path as needed
  
  import { PayInterval } from '@prisma/client';
  import { addDays, addWeeks, addMonths, addYears } from 'date-fns';
  
  describe('replaceSpacesWithUnderscores', () => {
    it('replaces single spaces', () => {
      expect(replaceSpacesWithUnderscores('hello world')).toBe('hello_world');
    });
  
    it('replaces multiple spaces', () => {
      expect(replaceSpacesWithUnderscores('a  b   c')).toBe('a__b___c');
    });
  
    it('returns original if no spaces', () => {
      expect(replaceSpacesWithUnderscores('no_spaces')).toBe('no_spaces');
    });
  });
  
  describe('sanitizeKongName', () => {
    it('converts spaces to underscores', () => {
      expect(sanitizeKongName('My Service Name')).toBe('my_service_name');
    });
  
    it('removes special characters except - and _', () => {
      expect(sanitizeKongName('Hello@!#World$%^')).toBe('helloworld');
    });
  
    it('preserves hyphens and underscores', () => {
      expect(sanitizeKongName('Hello-World_Name')).toBe('hello-world_name');
    });
  
    it('collapses multiple spaces into one underscore', () => {
      expect(sanitizeKongName('Foo   Bar')).toBe('foo_bar');
    });
  });
  
  describe('sanitizeRoutePath', () => {
    it('removes duplicate slashes', () => {
      expect(sanitizeRoutePath('///api///v1//users')).toBe('/api/v1/users');
    });
  
    it('removes trailing slash', () => {
      expect(sanitizeRoutePath('/api/v1/users/')).toBe('/api/v1/users');
    });
  
    it('lowercases the path', () => {
      expect(sanitizeRoutePath('/API/V1/USERS')).toBe('/api/v1/users');
    });
  
    it('combines all rules', () => {
      expect(sanitizeRoutePath('///Foo/Bar///')).toBe('/foo/bar');
    });
  
    it('leaves a single slash untouched', () => {
      expect(sanitizeRoutePath('/')).toBe('');
    });
  });
  
  describe('calculateEndTime', () => {
    const base = new Date('2025-04-30T00:00:00Z');
  
    it('adds one day for DAILY', () => {
      expect(calculateEndTime(base, 'DAILY')).toEqual(addDays(base, 1));
    });
  
    it('adds one week for WEEKLY', () => {
      expect(calculateEndTime(base, 'WEEKLY')).toEqual(addWeeks(base, 1));
    });
  
    it('adds one month for MONTHLY', () => {
      expect(calculateEndTime(base, 'MONTHLY')).toEqual(addMonths(base, 1));
    });
  
    it('adds one year for YEARLY', () => {
      expect(calculateEndTime(base, 'YEARLY')).toEqual(addYears(base, 1));
    });
  
    it('throws for unsupported intervals', () => {
      expect(() => calculateEndTime(base, 'HOURLY' as PayInterval)).toThrowError(
        'Unsupported interval: HOURLY'
      );
    });
  });
  