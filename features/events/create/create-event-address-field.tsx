import { useMemo, useState } from 'react';

import { AppInput } from '@/components/primitives';
import { MapSearchResults } from '@/components/search/map-search-results';
import { Locale, Coordinates } from '@/core/types/domain';
import { useLocationSearch } from '@/features/events/hooks/use-location-search';
import { LocationSearchResult } from '@/services/locationSearch';

type CreateEventAddressFieldProps = Readonly<{
  label: string;
  value: string;
  placeholder: string;
  locale: Locale;
  proximity?: Coordinates | undefined;
  searchingLabel: string;
  noResultsLabel: string;
  hintLabel: string;
  providerLabel: string;
  onChangeText: (value: string) => void;
  onSelectAddress: (result: LocationSearchResult) => void;
}>;

const toFullAddress = (result: LocationSearchResult) =>
  [result.title, result.subtitle].filter((part) => part.trim().length > 0).join(', ');

const HOUSE_NUMBER_PATTERN = /\b\d+[a-zA-Z]?(?:[/-]\d+[a-zA-Z]?)?\b/;

const getQueryHouseNumber = (query: string) => HOUSE_NUMBER_PATTERN.exec(query)?.[0];

const appendQueryHouseNumberIfMissing = (result: LocationSearchResult, query: string) => {
  const houseNumber = getQueryHouseNumber(query);
  if (!houseNumber || result.title.includes(houseNumber)) {
    return toFullAddress(result);
  }

  const titleWithNumber = /\d/.test(result.title) ? result.title : `${result.title} ${houseNumber}`;
  return [titleWithNumber, result.subtitle].filter((part) => part.trim().length > 0).join(', ');
};

const withQueryHouseNumberForDisplay = (result: LocationSearchResult, query: string): LocationSearchResult => {
  const houseNumber = getQueryHouseNumber(query);
  if (!houseNumber || /\d/.test(result.title)) {
    return result;
  }

  return {
    ...result,
    title: `${result.title} ${houseNumber}`,
  };
};

export function CreateEventAddressField({
  label,
  value,
  placeholder,
  locale,
  proximity,
  searchingLabel,
  noResultsLabel,
  hintLabel,
  providerLabel,
  onChangeText,
  onSelectAddress,
}: CreateEventAddressFieldProps) {
  const [focused, setFocused] = useState(false);
  const locationSearch = useLocationSearch(value, locale, proximity);
  const showResults = focused && value.trim().length > 0;
  const displayResults = useMemo(
    () => (locationSearch.data ?? []).map((result) => withQueryHouseNumberForDisplay(result, value)),
    [locationSearch.data, value],
  );

  return (
    <>
      <AppInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        placeholder={placeholder}
        autoCorrect={false}
        autoCapitalize="words"
        returnKeyType="search"
      />
      <MapSearchResults
        visible={showResults}
        loading={locationSearch.isFetching}
        query={value}
        results={displayResults}
        searchingLabel={searchingLabel}
        noResultsLabel={noResultsLabel}
        hintLabel={hintLabel}
        providerLabel={providerLabel}
        onSelectResult={(result) => {
          const originalResult = locationSearch.data?.find((item) => item.id === result.id) ?? result;
          setFocused(false);
          onChangeText(appendQueryHouseNumberIfMissing(result, value));
          onSelectAddress(originalResult);
        }}
      />
    </>
  );
}
